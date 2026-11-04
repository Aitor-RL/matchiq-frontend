import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import type { Catalog } from '@matchiq/shared';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export function useCompetition() {
  const [params] = useSearchParams();
  const value = params.get('competition');
  return value && ['fd-SP1', 'fd-SP2'].includes(value) ? value : undefined;
}
export async function get<T>(path: string, signal?: AbortSignal, competition?: string): Promise<T> {
  const [resource, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  if (competition) params.set('competition', competition);
  const timeout = AbortSignal.timeout(20000);
  let response: Response;
  try {
    response = await fetch(`${apiBase}/${resource}${params.size ? `?${params}` : ''}`, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(timeout.aborted ? 'La consulta está tardando demasiado. Vuelve a intentarlo.' : 'No hemos podido conectar. Comprueba tu conexión e inténtalo de nuevo.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.error ?? 'Los datos no están disponibles en este momento.', response.status);
  }
  return response.json().catch(() => { throw new Error('No hemos podido leer la respuesta. Vuelve a intentarlo.'); }) as Promise<T>;
}
export function useCatalog() {
  const competition = useCompetition();
  return useQuery({ queryKey: ['catalog', competition], queryFn: ({ signal }) => get<Catalog>('catalog', signal, competition) });
}
