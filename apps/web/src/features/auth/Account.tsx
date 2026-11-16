import { useEffect, useState, type FormEvent } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export const accountsEnabled = import.meta.env.VITE_ACCOUNTS_ENABLED === 'true';
const api = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
type Session = { access_token: string; user: { id: string; email: string } };
const storageKey = 'matchiq-session';

function saveSession(session: Session | null) {
  if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
  else sessionStorage.removeItem(storageKey);
  window.dispatchEvent(new Event(storageKey));
}

export function useSession() {
  const [session, setSession] = useState<Session | null>();
  useEffect(() => {
    function read() {
      try {
        setSession(JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'));
      } catch {
        setSession(null);
      }
    }
    read();
    window.addEventListener(storageKey, read);
    return () => window.removeEventListener(storageKey, read);
  }, []);
  return session;
}

async function authRequest(action: string, body: object = {}, session?: Session) {
  const response = await fetch(`${api}/auth/${action}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'No se pudo completar la operación.');
  return data;
}

export async function signOut(session: Session) {
  await authRequest('logout', {}, session);
  saveSession(null);
}
type AccountState = { id: string; name: string | null; verified: boolean; pass: { expiresAt: string; remaining: number } | null };

export function useAccount(session?: Session | null, pending = false) {
  return useQuery<AccountState>({
    queryKey: ['account', session?.user.id],
    enabled: Boolean(session),
    refetchInterval: (query) => pending && !query.state.data?.pass ? 3000 : false,
    queryFn: async ({ signal }) => {
      const response = await fetch(`${api}/me`, { headers: { Authorization: `Bearer ${session!.access_token}` }, signal });
      if (response.status === 401) saveSession(null);
      if (!response.ok) throw new Error('No se pudo verificar la cuenta en MatchIQ.');
      return response.json() as Promise<AccountState>;
    },
  });
}

export default function Account({ initialMode = 'login' }: { initialMode?: 'login' | 'register' | 'reset' }) {
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requested = params.get('volver') ?? '';
  const returnPath = /^\/comparador(?:\?|$)/.test(requested) ? requested : '/comparador';
  const [poll, setPoll] = useState(true);
  const pending = params.get('pago') === 'pendiente';
  const account = useAccount(session, pending && poll);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [invitation, setInvitation] = useState('');
  const [mode, setMode] = useState<string>(initialMode);
  const [linkToken, setLinkToken] = useState('');
  useEffect(() => {
    const link = new URLSearchParams(window.location.hash.slice(1));
    const action = link.get('action');
    const secret = link.get('token');
    if ((action === 'verify' || action === 'reset') && secret) {
      setMode('complete-' + action);
      setLinkToken(secret);
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
    }
  }, []);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPoll(false), 60000);
    return () => clearTimeout(timer);
  }, []);

  async function buy() {
    if (!session) return;
    setBusy(true);
    try {
      const response = await fetch(`${api}/billing/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath }),
      });
      if (!response.ok) throw new Error();
      const { url } = await response.json() as { url: string };
      window.location.assign(url);
    } catch {
      setMessage('No se pudo iniciar el pago de prueba.');
      setBusy(false);
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'login') {
        const data = await authRequest(mode, { email, password });
        saveSession({ access_token: data.token, user: { id: data.id, email: data.email } });
        navigate('/cuenta?' + new URLSearchParams({ volver: returnPath }), { replace: true });
      } else if (mode.startsWith('complete-')) {
        await authRequest(mode, { token: linkToken, ...(mode === 'complete-reset' ? { password, confirmation } : {}) });
        if (mode === 'complete-reset') saveSession(null);
        else void account.refetch();
        setLinkToken('');
        setMode('login');
        setMessage(mode === 'complete-reset' ? 'Contraseña guardada. Ya puedes entrar.' : 'Correo verificado.');
      } else if (mode === 'register') {
        await authRequest(mode, { email, name, age: Number(age), password, confirmation, invitation });
        navigate(`/login?${params}`, { replace: true, state: { registered: true } });
      } else {
        await authRequest(mode, { email });
        setMessage('Si procede, recibirás un enlace por correo.');
      }
      setPassword('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }
  return <section className="reading-panel auth-page">
    <h1>{mode === 'complete-verify' ? 'Verificar correo' : linkToken ? 'Nueva contraseña' : session ? 'Mi cuenta' : mode === 'register' ? 'Crear cuenta' : mode === 'reset' ? 'Recuperar contraseña' : 'Iniciar sesión'}</h1>
    {session === undefined ? <p>Comprobando sesión…</p>
      : session && !linkToken ? <>
        <p>{session.user.email}</p>
        {account.data?.name && <p>{account.data.name}</p>}
        {account.data && !account.data.verified && <button type="button" className="button secondary" disabled={busy} onClick={async () => {
          setBusy(true);
          try {
            await authRequest('verify', {}, session);
            setMessage('Revisa tu correo para activar la recuperación de contraseña.');
          } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo enviar el enlace.');
          } finally {
            setBusy(false);
          }
        }}>Verificar correo para recuperar mi contraseña</button>}
        {account.error && <p role="alert">{account.error.message}</p>}
        {account.data?.pass ? <p>Pase activo hasta {new Date(account.data.pass.expiresAt).toLocaleDateString('es-ES')}. {account.data.pass.remaining} informes nuevos disponibles.</p>
          : account.data && (pending ? <p>Confirmando pago. <button type="button" onClick={() => void account.refetch()}>Actualizar estado</button></p>
            : <button type="button" className="button primary" disabled={busy} onClick={buy}>Pase IA de prueba · 2 € · 30 días</button>)}
        <p><Link to={returnPath}>Volver al comparador</Link></p>
        <button type="button" className="button secondary" onClick={async () => {
          try {
            await signOut(session);
            setMessage('');
          } catch {
            setMessage('No se pudo cerrar la sesión. Inténtalo de nuevo.');
          }
        }}>Cerrar sesión</button>
      </> : <form onSubmit={signIn}>
        {!linkToken && <label>Correo electrónico <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
        {mode === 'register' && <>
          <label>Nombre <input autoComplete="given-name" minLength={2} maxLength={80} value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Edad <select value={age} onChange={(event) => setAge(event.target.value)} required>
            <option value="">Selecciona tu edad</option>
            {Array.from({ length: 108 }, (_, index) => index + 13).map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <label>Código de invitación, si te lo han dado <input value={invitation} onChange={(event) => setInvitation(event.target.value)} maxLength={256} /></label>
        </>}
        {['login', 'register', 'complete-reset'].includes(mode) && <label>Contraseña <input type="password" minLength={12} maxLength={128}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
        {['register', 'complete-reset'].includes(mode) && <>
          <small>Usa al menos 12 caracteres, con letras y números.</small>
          <label>Repetir contraseña <input type="password" autoComplete="new-password" minLength={12} maxLength={128}
            value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
        </>}
        <button className="button primary" disabled={busy}>{mode === 'complete-verify' ? 'Confirmar correo' : linkToken ? 'Guardar contraseña' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}</button>
        {!linkToken && <div className="auth-alternatives">
          {mode !== 'login' && <Link to={`/login?${params}`}>Iniciar sesión</Link>}
          {mode !== 'register' && <Link to={`/registro?${params}`}>Crear cuenta</Link>}
          {mode !== 'reset' && <Link to={`/recuperar?${params}`}>¿Olvidaste tu contraseña?</Link>}
        </div>}
      </form>}
    <p role="status">{message}</p>
  </section>;
}

