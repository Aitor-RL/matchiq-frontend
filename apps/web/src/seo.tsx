import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import type { TeamDetail, FixtureView } from '@matchiq/shared';

export const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://matchiq-frontend.vercel.app').replace(/\/+$/, '');
export const pageMeta = {
  '/inicio': { title: 'MatchIQ — Estadísticas de fútbol con contexto', description: 'Explora equipos y compara goles, córners, tarjetas y tiros. Entiende el fútbol con muestras, temporadas y fuentes visibles.' },
  '/equipos': { title: 'Equipos y estadísticas de fútbol | MatchIQ', description: 'Encuentra equipos de Primera y Segunda División y explora sus resultados, forma reciente y estadísticas por temporada.' },
  '/comparador': { title: 'Comparador de equipos de fútbol | MatchIQ', description: 'Compara dos equipos por goles, córners, amarillas y tiros. Filtra por temporada, últimos partidos y rendimiento local o visitante.' },
} as const;
export type Meta = { title: string; description: string; canonical: string; noindex: boolean };
export function routeMeta(pathname: string, search = ''): Meta {
  const known = pageMeta[pathname as keyof typeof pageMeta];
  const dynamic = /^\/(equipos|partidos)\/[^/]+$/.test(pathname);
  const params = new URLSearchParams(search);
  const filtered = pathname !== '/inicio' && [...params.keys()].some((key) => !['utm_source', 'utm_medium', 'utm_campaign'].includes(key));
  return { ...(known ?? { title: dynamic ? 'Estadísticas del encuentro y del equipo | MatchIQ' : 'Página no encontrada | MatchIQ', description: dynamic ? 'Consulta resultados y estadísticas de fútbol con su muestra, temporada y fuente.' : 'La página que buscas no existe. Explora equipos o vuelve al comparador de MatchIQ.' }), canonical: `${siteUrl}${pathname}`, noindex: !known || filtered };
}
export function PageMeta({ title, description, noindex = false }: { title?: string; description?: string; noindex?: boolean }) {
  const location = useLocation();
  const client = useQueryClient();
  useIsFetching();
  const params = new URLSearchParams(location.search);
  const competition = params.get('competition') || undefined;
  const teamId = /^\/equipos\/([^/]+)$/.exec(location.pathname)?.[1];
  const fixtureId = /^\/partidos\/([^/]+)$/.exec(location.pathname)?.[1];
  const team = teamId ? client.getQueriesData<TeamDetail>({ queryKey: ['team', competition, teamId] }).map(([, data]) => data).find((data) => data && (!params.get('season') || data.filters.season === params.get('season'))) : undefined;
  const fixture = fixtureId ? client.getQueryData<{ fixture: FixtureView }>(['fixture', competition, fixtureId])?.fixture : undefined;
  const resolvedTitle = title ?? (team ? `${team.team.name}: resultados y estadísticas | MatchIQ` : fixture ? `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} | MatchIQ` : undefined);
  const resolvedDescription = description ?? (team ? `Explora la forma reciente de ${team.team.name}, sus resultados y medias de goles, córners, tarjetas y tiros en la temporada seleccionada.` : undefined);
  useEffect(() => {
    const meta = routeMeta(location.pathname, location.search);
    document.title = resolvedTitle ?? meta.title;
    const put = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.append(el); }
      el.content = content;
    };
    put('description', resolvedDescription ?? meta.description);
    put('robots', noindex || meta.noindex ? 'noindex,follow' : 'index,follow');
    put('og:title', resolvedTitle ?? meta.title, true); put('og:description', resolvedDescription ?? meta.description, true); put('og:url', meta.canonical, true);
    put('twitter:title', resolvedTitle ?? meta.title); put('twitter:description', resolvedDescription ?? meta.description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = meta.canonical;
  }, [location.pathname, location.search, resolvedTitle, resolvedDescription, noindex]);
  return null;
}
