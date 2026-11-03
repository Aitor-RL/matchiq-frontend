import { useQuery } from '@tanstack/react-query';
import type { Catalog } from '@matchiq/shared';

const apiBase = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');

export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const competition = localStorage.getItem('matchiq-competition');
  const suffix = competition && ['fd-SP1', 'fd-SP2'].includes(competition) ? `${path.includes('?') ? '&' : '?'}competition=${competition}` : '';
  const response = await fetch(`${apiBase}/${path}${suffix}`, { signal });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'No se puede conectar con la API local. Comprueba que está arrancada.');
  }
  return response.json() as Promise<T>;
}
export const useCatalog = () => useQuery({ queryKey: ['catalog'], queryFn: ({ signal }) => get<Catalog>('catalog', signal) });
