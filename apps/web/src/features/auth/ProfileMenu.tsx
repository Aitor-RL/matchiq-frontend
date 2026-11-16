import { useEffect, useRef, useState } from 'react';
import { ChevronDown, CircleHelp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, useAccount, useSession } from './Account';

export default function ProfileMenu() {
  const session = useSession();
  const account = useAccount(session);
  const navigate = useNavigate();
  const menu = useRef<HTMLDetailsElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menu.current && event.target instanceof Node && !menu.current.contains(event.target)) menu.current.open = false;
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  if (!session) return <div className="auth-links"><Link to="/login">Iniciar sesión</Link><Link className="auth-register" to="/registro">Registrarse</Link></div>;

  return <details className="profile-menu" ref={menu} onKeyDown={(event) => {
    if (event.key === 'Escape' && menu.current?.open) {
      menu.current.open = false;
      menu.current.querySelector('summary')?.focus();
    }
  }}>
    <summary aria-label={account.data?.name ? `Opciones de ${account.data.name}` : 'Opciones de perfil'}>
      <img src="/brand/icon-192.png" alt="" width="30" height="30" />
      <span>{account.data?.name || 'Perfil'}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </summary>
    <div className="profile-dropdown">
      <Link to="/cuenta" onClick={() => { if (menu.current) menu.current.open = false; }}>Perfil</Link>
      <Link to="/informacion" onClick={() => { if (menu.current) menu.current.open = false; }}><CircleHelp size={15} aria-hidden="true" /> Información</Link>
      <button type="button" disabled={busy} onClick={async () => {
        setBusy(true);
        setError('');
        try {
          await signOut(session);
          navigate('/inicio');
        } catch {
          setError('No se pudo cerrar la sesión.');
        } finally {
          setBusy(false);
        }
      }}>{busy ? 'Saliendo…' : 'Salir'}</button>
      {error && <p role="alert">{error}</p>}
    </div>
  </details>;
}
