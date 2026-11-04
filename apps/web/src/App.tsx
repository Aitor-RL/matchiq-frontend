import { lazy, Suspense, useEffect, useId, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftRight, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, CircleHelp, Database, FlaskConical, Info, ListFilter, RotateCcw, Search, SlidersHorizontal, Target, Trophy, X } from 'lucide-react';
import { filtersSchema, fixtureStatusLabels, metricLabels, type Catalog, type Comparison, type Filters, type FixtureView, type Metric, type MetricKey, type Provenance, type Team, type TeamDetail, type TeamSummary } from '@matchiq/shared';
import { get, useCatalog, useCompetition } from './api';
import { Link, NavLink } from './navigation';
import { Loading, Updating } from './components/Loading';
import { PageMeta } from './seo';

const defaults = { a: 'bruma', b: 'faro', season: '2024', last: '10', venue: 'all' };
const number = (n: number | null, digits = 1) => n === null ? '—' : new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
const date = (s: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' }).format(new Date(s));
const shortDate = (s: string) => new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', timeZone: 'Europe/Madrid' }).format(new Date(s));
// Current Spanish seasons use the starting year; the synthetic demo retains its original label.
const seasonLabel = (s: string) => Number(s) >= 2025 ? `${s}/${String(Number(s) + 1).slice(-2)}` : s;
const resultText = { W: 'Victoria', D: 'Empate', L: 'Derrota' };

function Badge({ team, purple = false, small = false }: { team: Team; purple?: boolean; small?: boolean }) {
  return <span className={`team-badge ${purple ? 'purple' : ''} ${small ? 'small' : ''}`} aria-hidden="true"><span>{team.initials}</span><span className="badge-ball">✦</span></span>;
}
function Form({ values }: { values: TeamSummary['form'] }) {
  return <div className="form-pills" aria-label="Forma reciente, del más reciente al más antiguo">{values.map((v, i) => <span key={i} className={`result ${v}`} title={resultText[v]} aria-label={resultText[v]}>{v === 'W' ? 'V' : v === 'D' ? 'E' : 'D'}</span>)}{!values.length && <span className="muted">Sin resultados</span>}</div>;
}
function ErrorPanel({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="error-panel" role="alert"><Info /><h2>No hemos podido cargar los datos</h2><p>{message}</p>{retry && <button className="button" onClick={retry}><RotateCcw size={16} /> Reintentar</button>}</div>;
}
function Source({ provenance }: { provenance: Provenance }) {
  return <div className="source-line"><Database size={14} /><span>{provenance.source} <span className="source-separator">/</span> Conjunto actualizado: {date(provenance.updatedAt)} <span className="source-separator">/</span> {provenance.mode === 'synthetic' ? 'Datos ficticios de prueba' : 'Datos importados · Sin actualización en directo'}</span></div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [showInfo, setShowInfo] = useState(false);
  const catalog = useCatalog();
  const synthetic = catalog.data?.provenance.mode !== 'provider';
  return <>
    <PageMeta />
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <header className="site-header"><div className="header-inner">
      <Link to="/inicio" className="wordmark" aria-label="MatchIQ, inicio"><img src="/brand/logo.svg" width="260" height="64" alt="" fetchPriority="high" /></Link>
      <nav aria-label="Navegación principal"><NavLink to="/inicio">Inicio</NavLink><NavLink to="/equipos">Equipos</NavLink><NavLink to="/comparador"><ArrowLeftRight size={17} />Comparador</NavLink></nav>
      <div className="header-end"><span className="local-status"><i /> {catalog.isError ? 'Sin conexión' : catalog.data ? 'Datos con fuente' : 'Conectando'}</span><button className="icon-button" aria-label="Información de los datos" aria-expanded={showInfo} onClick={() => setShowInfo(!showInfo)}>{showInfo ? <X size={20} /> : <CircleHelp size={20} />}</button></div>
    </div></header>
    {showInfo && <aside className="info-drawer"><div><strong>Estás probando MatchIQ.</strong><p>{catalog.data?.provenance.note ?? 'Consultando el estado de los datos.'}</p><p>Los cálculos excluyen los valores ausentes y solo incluyen partidos finalizados en tiempo reglamentario. No hay actualización en directo.</p><p>MatchIQ es una plataforma independiente, sin afiliación ni patrocinio de clubes o competiciones. Los emblemas con iniciales son gráficos propios, no escudos oficiales.</p></div></aside>}
    <div className="demo-strip"><Database size={14} /><strong>{!catalog.data ? 'ESTADO DE DATOS' : synthetic ? 'DATOS SINTÉTICOS' : 'DATOS IMPORTADOS'}</strong><span>{!catalog.data ? 'Consultando la fuente de datos' : synthetic ? 'Entorno de prueba · Equipos y resultados ficticios' : `${catalog.data.competition.name} · Fuente: ${catalog.data.provenance.source}`}</span><span className="strip-end">SIN ACTUALIZACIÓN EN DIRECTO <span aria-hidden="true">↗</span></span></div>
    <main id="contenido" className="page-container">{children}</main>
    <footer className="site-footer"><Link className="footer-logo" to="/inicio" aria-label="MatchIQ, inicio"><img src="/brand/logo-mono.svg" width="260" height="64" alt="" loading="lazy" /></Link><span>El juego, en datos. Plataforma independiente.</span><span className="footer-demo"><Database size={13} /> {!catalog.data ? 'CONECTANDO' : synthetic ? 'DEMOSTRACIÓN' : 'DATOS IMPORTADOS'} · V0.3</span></footer>
  </>;
}

function useFilters() {
  const [params, setParams] = useSearchParams();
  const catalog = useCatalog();
  const defaultSeason = catalog.data?.seasons[0] ?? '2024';
  const parsed = filtersSchema.safeParse({ ...Object.fromEntries(params), season: params.get('season') ?? defaultSeason });
  const filters: Filters = parsed.success ? parsed.data : { season: defaultSeason, last: '10', venue: 'all' };
  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    next.set('season', filters.season);
    if (catalog.data?.competition.id.startsWith('fd-')) next.set('competition', catalog.data.competition.id);
    Object.entries(patch).forEach(([key, value]) => next.set(key, value));
    setParams(next);
  };
  return { params, filters, update, invalid: !parsed.success || !!(params.get('competition') && !['fd-SP1', 'fd-SP2'].includes(params.get('competition')!)) || !!(catalog.data && !catalog.data.seasons.includes(filters.season)), reset: () => setParams({ ...defaults, ...(catalog.data?.competition.id.startsWith('fd-') ? { competition: catalog.data.competition.id } : {}), a: catalog.data?.teams.find((t) => t.id === defaults.a)?.id ?? catalog.data?.teams[0]?.id ?? defaults.a, b: catalog.data?.teams.find((t) => t.id === defaults.b)?.id ?? catalog.data?.teams[1]?.id ?? defaults.b, season: defaultSeason }) };
}

function SelectField({ label, value, onChange, children, disabled = false }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode; disabled?: boolean }) {
  const id = useId();
  return <div className="select-field"><label htmlFor={id}>{label}</label><span className="select-wrap"><select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}>{children}</select><ChevronDown size={16} aria-hidden="true" /></span></div>;
}

function FilterPanel({ catalog, a, b, filters, update, reset }: { catalog: Catalog; a: string; b: string; filters: Filters; update: (patch: Record<string, string>) => void; reset: () => void }) {
  const teams = catalog.teams;
  return <aside className="filter-column"><div className="filter-panel">
    <div className="panel-top"><h2><SlidersHorizontal size={18} />Tu comparación</h2><span className="tiny-index">01—02</span></div>
    <div className="filter-body">
      <p className="filter-caption">ELIGE A LOS PROTAGONISTAS</p>
      <div className="team-select green-select"><span className="team-marker">A</span><SelectField label="Primer equipo" value={a} onChange={(value) => update({ a: value })}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === b}>{t.name}</option>)}</SelectField></div>
      <button className="swap-button" onClick={() => update({ a: b, b: a })}><ArrowLeftRight size={15} /> Intercambiar equipos</button>
      <div className="team-select purple-select"><span className="team-marker">B</span><SelectField label="Segundo equipo" value={b} onChange={(value) => update({ b: value })}>{teams.map((t) => <option key={t.id} value={t.id} disabled={t.id === a}>{t.name}</option>)}</SelectField></div>
      <div className="filter-divider" />
      <p className="filter-caption">ACOTA EL ANÁLISIS</p>
      <div className="competition-label"><Trophy size={16} /><span>{catalog.competition.name}<small>{catalog.provenance.mode === 'synthetic' ? 'Competición sintética' : catalog.competition.country}</small></span></div>
      <SelectField label="Temporada" value={filters.season} onChange={(season) => update({ season })}>{catalog.seasons.map((season) => <option key={season} value={season}>{seasonLabel(season)}{catalog.provenance.mode === 'synthetic' ? ' · demo' : ''}</option>)}</SelectField>
      <fieldset className="sample-field"><legend>Últimos partidos</legend><div className="segmented">{['5', '10', '20'].map((last) => <button key={last} aria-pressed={last === filters.last} onClick={() => update({ last })}>{last}</button>)}</div></fieldset>
      <SelectField label="Condición" value={filters.venue} onChange={(venue) => update({ venue })}><option value="all">Local y visitante</option><option value="home">Solo como local</option><option value="away">Solo como visitante</option></SelectField>
      <div className="auto-applied"><Check size={13} /> Los filtros se aplican al cambiar</div>
      <button className="reset-button" onClick={reset}><RotateCcw size={14} /> Restablecer filtros</button>
    </div>
  </div><div className="filter-note"><span className="note-star" aria-hidden="true">✳</span><h3>EL CONTEXTO<br />TAMBIÉN JUEGA.</h3><p>Compara el mismo periodo y mira la muestra. Un número cuenta más cuando sabes de dónde viene.</p><span className="note-bottom">MENOS INTUICIÓN. MÁS DATOS. <ArrowUpRight size={17} /></span></div></aside>;
}

function TeamCard({ summary, side }: { summary: Comparison['a']; side: 'A' | 'B' }) {
  const purple = side === 'B';
  const catalog = useCatalog();
  return <article className={`team-card ${purple ? 'team-b' : 'team-a'}`}>
    <div className="team-card-top"><span>EQUIPO {side}</span><span className="demo-mini">{catalog.data?.provenance.mode === 'provider' ? 'IMPORTADO' : 'FICTICIO'}</span></div>
    <div className="team-card-main"><Badge team={summary.team} purple={purple} /><div><h2>{summary.team.name}</h2><span className="team-country">{catalog.data?.competition.name} <span>·</span> {summary.total} partidos</span></div><Link className="team-detail-link" to={`/equipos/${summary.team.id}`} aria-label={`Ver ficha de ${summary.team.name}`}><ArrowUpRight size={22} /></Link></div>
    <div className="team-card-bottom"><Form values={summary.form} /><span>Más reciente primero</span></div>
  </article>;
}

function MetricValue({ metric }: { metric: Metric }) {
  const value = metric ?? { value: null, valid: 0, total: 0, unit: 'por partido' as const };
  return <div className="metric-value"><strong>{number(value.value, value.unit === '%' ? 0 : value.value !== null && !Number.isInteger(value.value) ? 2 : 1)}{value.unit === '%' && value.value !== null ? <small>%</small> : null}</strong><span>{value.valid}/{value.total} con dato</span></div>;
}
function MetricComparison({ data }: { data: Comparison }) {
  const keys: MetricKey[] = ['goalsFor', 'goalsAgainst', 'halftimeGoalsFor', 'halftimeGoalsAgainst', 'xgFor', 'xgAgainst', 'shots', 'shotsOnTarget', 'corners', 'fouls', 'yellows', 'redCards', 'btts', 'over25'];
  return <section className="panel metrics-panel" aria-labelledby="metrics-title"><div className="section-head"><h2 id="metrics-title"><BarChart3 size={19} />Frente a frente</h2><span className="eyebrow">MEDIAS Y PORCENTAJES</span></div>
    <div className="metrics-column-labels"><span><i className="dot green" />{data.a.team.shortName}</span><span>MÉTRICA</span><span>{data.b.team.shortName}<i className="dot purple-dot" /></span></div>
    {keys.map((key) => {
      const empty: Metric = { value: null, valid: 0, total: data.a.total, unit: 'por partido' };
      const a = data.a.metrics?.[key] ?? empty, b = data.b.metrics?.[key] ?? { ...empty, total: data.b.total };
      const max = Math.max(a.value ?? 0, b.value ?? 0, 1);
      return <div className="metric-row" key={key}>
        <MetricValue metric={a} /><div className="metric-center"><h3>{metricLabels[key]}</h3><span>{a.unit === '%' ? 'Porcentaje de partidos' : 'Media por partido'}</span><div className="comparison-track" aria-hidden="true"><div className="track-a"><i style={{ width: `${((a.value ?? 0) / max) * 100}%` }} /></div><div className="track-b"><i style={{ width: `${((b.value ?? 0) / max) * 100}%` }} /></div></div></div><MetricValue metric={b} />
      </div>;
    })}
    <div className="metrics-foot"><Info size={14} /><span>Las medias excluyen los datos ausentes. Los ceros válidos sí cuentan.</span></div>
  </section>;
}

const LazyTrendChart = lazy(() => import('./components/TrendChart'));
function TrendChart(props: { summary: Comparison['a'] | (TeamSummary & { team: Team }) }) {
  return <Suspense fallback={<Loading kind="chart" />}><LazyTrendChart {...props} /></Suspense>;
}

function Reading({ data }: { data: Comparison }) {
  const a = data.a, b = data.b;
  return <section className="reading-panel"><div className="reading-label"><span className="reading-icon"><Target size={18} /></span>LECTURA DEL JUEGO<span className="tag">SIN IA</span></div><h2>LOS NÚMEROS<br />TIENEN ALGO<br />QUE CONTAR.</h2>
    <p><strong>{a.team.name}</strong> registra <strong>{number(a.metrics.goalsFor.value)} goles a favor</strong> por encuentro en su muestra de {a.metrics.goalsFor.valid} partidos con dato.</p>
    <p><strong>{b.team.name}</strong> registra <strong>{number(b.metrics.goalsFor.value)} goles</strong> por encuentro en {b.metrics.goalsFor.valid} partidos con dato.</p>
    <div className="reading-note"><Info size={14} /><span>Resumen calculado, no una predicción. Muestras {data.provenance.mode === 'synthetic' ? 'sintéticas' : 'del proveedor'} de la temporada {seasonLabel(data.filters.season)}.</span></div>
  </section>;
}

function FixtureList({ fixtures, empty = 'No hay partidos en esta selección.' }: { fixtures: FixtureView[]; empty?: string }) {
  if (!fixtures.length) return <p className="empty-state">{empty}</p>;
  return <div className="fixture-list">{fixtures.map((f) => <Link to={`/partidos/${f.id}`} className="fixture-row" key={f.id}><span className="fixture-date">{shortDate(f.date)}<small>{new Date(f.date).getUTCFullYear()}</small></span><span className="fixture-home">{f.homeTeam.name}</span><span className="score">{f.status === 'FT' ? `${f.home.goals ?? '—'} — ${f.away.goals ?? '—'}` : f.status === 'PST' ? 'APL.' : 'PEND.'}</span><span className="fixture-away">{f.awayTeam.name}</span><ArrowUpRight size={15} aria-hidden="true" /></Link>)}</div>;
}

function ComparePage() {
  const selectedCompetition = useCompetition();
  const catalog = useCatalog();
  const competition = selectedCompetition ?? (catalog.data?.competition.id.startsWith('fd-') ? catalog.data.competition.id : undefined);
  const { params, filters, update, reset, invalid } = useFilters();
  const a = params.get('a') || catalog.data?.teams.find((t) => t.id === defaults.a)?.id || catalog.data?.teams[0]?.id || defaults.a, b = params.get('b') || catalog.data?.teams.find((t) => t.id === defaults.b)?.id || catalog.data?.teams[1]?.id || defaults.b;
  const [tab, setTab] = useState<'metrics' | 'history'>('metrics');
  const query = new URLSearchParams({ ...filters, a, b }).toString();
  const comparison = useQuery({ queryKey: ['compare', competition, query], queryFn: ({ signal }) => get<Comparison>(`compare?${query}`, signal, competition), placeholderData: (previous, previousQuery) => previousQuery?.queryKey[1] === competition ? previous : undefined, enabled: !invalid && !!catalog.data && catalog.data.teams.length >= 2 });
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="small-cross">✳</span> EL FÚTBOL, CON PERSPECTIVA</div><h1>COMPARA EL <span>JUEGO.</span></h1><p>Dos equipos. La misma lupa. Tú sacas las conclusiones.</p></div><div className="heading-index"><span>LAB / 001</span><ArrowDown size={24} /></div></div>
    {catalog.isPending ? <Loading /> : catalog.isError ? <ErrorPanel message={catalog.error.message} retry={() => void catalog.refetch()} /> : <div className="workspace-grid">
      <FilterPanel catalog={catalog.data} a={a} b={b} filters={filters} update={update} reset={reset} />
      <div className="comparison-content" aria-busy={comparison.isFetching}>
        {comparison.isFetching && comparison.data && <Updating stale={comparison.isPlaceholderData} />}
        {catalog.data.teams.length < 2 ? <p className="empty-state">Se necesitan al menos dos equipos importados para comparar.</p> : invalid ? <ErrorPanel message="Los filtros del enlace no son válidos. Restablécelos para continuar." retry={reset} /> : comparison.isPending ? <Loading /> : comparison.isError ? <ErrorPanel message={comparison.error.message} retry={() => void comparison.refetch()} /> : <>
          <div className="context-row"><span><Trophy size={14} />{catalog.data.competition.name.toLocaleUpperCase('es')} <span className="context-slash">/</span> {seasonLabel(comparison.data.filters.season)}</span><span><CalendarDays size={14} />Últimos {comparison.data.filters.last} · {comparison.data.filters.venue === 'all' ? 'Local + visitante' : comparison.data.filters.venue === 'home' ? 'Como local' : 'Como visitante'}</span></div>
          <div className="team-cards"><TeamCard summary={comparison.data.a} side="A" /><span className="versus" aria-hidden="true">VS</span><TeamCard summary={comparison.data.b} side="B" /></div>
          <div className="analysis-tabs" role="group" aria-label="Vista del análisis"><button aria-pressed={tab === 'metrics'} onClick={() => setTab('metrics')}><BarChart3 size={16} />Estadísticas</button><button aria-pressed={tab === 'history'} onClick={() => setTab('history')}><ArrowLeftRight size={16} />Enfrentamientos <span>{comparison.data.headToHead.length}</span></button><span className="sample-status"><i />MUESTRA DISPONIBLE</span></div>
          {tab === 'metrics' ? <><MetricComparison data={comparison.data} /><div className="bottom-grid"><TrendChart summary={comparison.data.a} /><Reading data={comparison.data} /></div></> : <section className="panel"><div className="section-head"><div><h2>Historial entre equipos</h2><p>Todos sus enfrentamientos finalizados de {seasonLabel(comparison.data.filters.season)}. Independiente del filtro de últimos partidos y condición.</p></div></div><FixtureList fixtures={comparison.data.headToHead} /></section>}
          <div className="sample-periods"><span><strong>{comparison.data.a.team.shortName}:</strong> {comparison.data.a.period.from ? `${date(comparison.data.a.period.from)} — ${date(comparison.data.a.period.to!)}` : 'Sin partidos'}</span><span><strong>{comparison.data.b.team.shortName}:</strong> {comparison.data.b.period.from ? `${date(comparison.data.b.period.from)} — ${date(comparison.data.b.period.to!)}` : 'Sin partidos'}</span></div>
          <ShareButton values={{ ...comparison.data.filters, a: comparison.data.a.team.id, b: comparison.data.b.team.id, ...(catalog.data.competition.id.startsWith('fd-') ? { competition: catalog.data.competition.id } : {}) }} disabled={comparison.isFetching} />
          <Source provenance={comparison.data.provenance} />
        </>}
      </div>
    </div>}
  </>;
}

function TeamsPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const filtered = catalog.data?.teams.filter((t) => t.name.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))) ?? [];
  const division = catalog.data?.competition.id;
  const chooseDivision = (value: string) => setParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set('competition', value);
    return next;
  });
  return <><div className="teams-page-heading page-heading"><div><div className="eyebrow">EL PUNTO DE PARTIDA</div><h1>CADA EQUIPO,<br /><span>SU HISTORIA.</span></h1><p>{catalog.data?.provenance.mode === 'provider' ? 'Explora los equipos disponibles en la competición importada.' : catalog.data ? 'Explora los equipos ficticios del laboratorio MatchIQ.' : 'Encuentra un equipo y explora sus resultados, forma reciente y estadísticas.'}</p></div>{division?.startsWith('fd-') && <div className="division-picker"><span className="division-picker-label">EXPLORAR COMPETICIÓN</span><div className="division-options" role="group" aria-label="Seleccionar división"><button type="button" aria-pressed={division === 'fd-SP1'} onClick={() => chooseDivision('fd-SP1')}><span>01</span>Primera</button><button type="button" aria-pressed={division === 'fd-SP2'} onClick={() => chooseDivision('fd-SP2')}><span>02</span>Segunda</button></div></div>}</div>
    <label className="search-box"><Search size={21} /><span className="sr-only">Buscar equipos</span><input placeholder="Busca un equipo…" value={search} onChange={(e) => setParams((previous) => { const next = new URLSearchParams(previous); if (e.target.value) next.set('q', e.target.value); else next.delete('q'); return next; })} /><span>{filtered.length} equipos</span></label>
    {catalog.isPending ? <Loading kind="teams" /> : catalog.isError ? <ErrorPanel message={catalog.error.message} retry={() => void catalog.refetch()} /> : <><div className="teams-grid">{filtered.map((team, i) => <Link to={`/equipos/${team.id}`} key={team.id} className={`team-directory-card ${i % 2 ? 'directory-purple' : ''}`}><div className="directory-top"><span>{catalog.data.provenance.mode === 'provider' ? 'CLUB · DATOS IMPORTADOS' : 'CLUB DE PRUEBA'}</span><ArrowUpRight size={20} /></div><Badge team={team} purple={i % 2 === 1} /><h2>{team.name}</h2><p>{team.city ?? 'Ciudad no disponible'}</p><div className="directory-bottom"><span>VER EQUIPO</span><span>→</span></div></Link>)}</div>{!filtered.length && <div className="empty-state"><Search /><h2>No encontramos ese equipo</h2><p>Prueba con otro nombre o consulta todos los equipos disponibles.</p><button className="button" onClick={() => setParams((previous) => { const next = new URLSearchParams(previous); next.delete('q'); return next; })}>Ver todos</button></div>}</>}
  </>;
}

function TeamPage() {
  const { id } = useParams();
  const catalog = useCatalog();
  const { filters, update, invalid, reset } = useFilters();
  const query = new URLSearchParams(filters).toString();
  const competition = useCompetition();
  const detail = useQuery({ queryKey: ['team', competition, id, query], queryFn: ({ signal }) => get<TeamDetail>(`teams/${id}?${query}`, signal, competition), enabled: !invalid && !!catalog.data });
  if (catalog.isError) return <ErrorPanel message={catalog.error.message} retry={() => void catalog.refetch()} />;
  if (invalid) return <ErrorPanel message="Los filtros del enlace no son válidos." retry={reset} />;
  if (detail.isPending) return <Loading kind="team" />;
  if (detail.isError) return <ErrorPanel message={detail.error.message} retry={() => void detail.refetch()} />;
  const { team, summary, fixtures, provenance } = detail.data;
  const synthetic = provenance.mode === 'synthetic';
  const opponent = catalog.data?.teams.find((t) => t.id !== team.id);
  return <><Link className="back-link" to="/equipos"><ArrowLeft size={16} />Todos los equipos</Link><div className="team-profile-heading"><Badge team={team} /><div><div className="eyebrow">{synthetic ? 'EQUIPO FICTICIO' : 'DATOS IMPORTADOS'} · {catalog.data?.competition.name.toLocaleUpperCase('es')}</div><h1>{team.name}</h1><p>{team.city ?? 'Ciudad no disponible'} · {team.founded === null ? 'Fundación no disponible' : `${synthetic ? 'Fundación ficticia' : 'Fundación'}: ${team.founded}`}</p></div><Link className="button primary" to={`/comparador?a=${team.id}&b=${opponent?.id ?? ''}&${query}`}><ArrowLeftRight size={17} />Comparar equipo</Link></div>
    <div className="profile-filters"><SelectField label="Temporada" value={filters.season} onChange={(season) => update({ season })}>{catalog.data?.seasons.map((season) => <option key={season} value={season}>{seasonLabel(season)}{synthetic ? ' · demo' : ''}</option>)}</SelectField><SelectField label="Muestra" value={filters.last} onChange={(last) => update({ last })}><option value="5">Últimos 5</option><option value="10">Últimos 10</option><option value="20">Últimos 20</option></SelectField><SelectField label="Condición" value={filters.venue} onChange={(venue) => update({ venue })}><option value="all">Local y visitante</option><option value="home">Solo local</option><option value="away">Solo visitante</option></SelectField><div><span className="eyebrow">FORMA RECIENTE</span><Form values={summary.form} /></div></div>
    <div className="profile-metrics">{(['goalsFor', 'goalsAgainst', 'xgFor', 'xgAgainst', 'halftimeGoalsFor', 'halftimeGoalsAgainst', 'shots', 'shotsOnTarget', 'corners', 'fouls', 'yellows', 'redCards'] as MetricKey[]).map((key) => { const metric = summary.metrics?.[key]; return <article className="panel mini-metric" key={key}><span>{metricLabels[key]}</span><strong>{metric ? number(metric.value, key.startsWith('xg') ? 2 : 1) : '—'}</strong><small>{metric ? `por partido · ${metric.valid}/${summary.total} con dato` : 'Estadística aún no disponible'}</small></article>; })}</div>
    <div className="profile-grid"><section className="panel"><div className="section-head"><div><h2>Resultados disponibles</h2><p>{summary.total} partidos finalizados · {seasonLabel(filters.season)}</p></div><CalendarDays size={19} /></div><FixtureList fixtures={fixtures} /></section><TrendChart summary={{ ...summary, team }} /></div><Source provenance={provenance} />
  </>;
}

function FixturePage() {
  const competition = useCompetition();
  const { id } = useParams();
  const detail = useQuery({ queryKey: ['fixture', competition, id], queryFn: ({ signal }) => get<{ fixture: FixtureView; provenance: Provenance }>(`fixtures/${id}`, signal, competition) });
  if (detail.isPending) return <Loading />;
  if (detail.isError) return <ErrorPanel message={detail.error.message} retry={() => void detail.refetch()} />;
  const { fixture: f, provenance } = detail.data;
  const synthetic = provenance.mode === 'synthetic';
  const stats: { key: keyof typeof f.home; label: string; digits?: number }[] = [
    { key: 'halftimeGoals', label: 'Goles al descanso' }, { key: 'goals', label: 'Goles al final' },
    { key: 'expectedGoals', label: 'xG', digits: 2 }, { key: 'shots', label: 'Tiros totales' },
    { key: 'shotsOnTarget', label: 'Tiros a puerta' }, { key: 'corners', label: 'Córners' },
    { key: 'fouls', label: 'Faltas' }, { key: 'yellows', label: 'Tarjetas amarillas' },
    { key: 'redCards', label: 'Tarjetas rojas' },
  ];
  return <><Link className="back-link" to="/equipos"><ArrowLeft size={16} />Explorar equipos</Link><div className="page-heading"><div><div className="eyebrow">{synthetic ? 'PARTIDO SINTÉTICO' : 'REGISTRO DEL PROVEEDOR'} · {seasonLabel(f.season)}</div><h1>EL PARTIDO,<br /><span>AL DETALLE.</span></h1><p>{date(f.date)} · {provenance.source}</p></div></div><section className="match-scoreboard"><Link to={`/equipos/${f.homeId}`}><Badge team={f.homeTeam} /><h2>{f.homeTeam.name}</h2><span>LOCAL</span></Link><div><span className="tag">{fixtureStatusLabels[f.status].toLocaleUpperCase('es')}</span><strong>{f.home.goals ?? '—'} : {f.away.goals ?? '—'}</strong><small>{synthetic ? 'Resultado ficticio' : 'Marcador registrado · Sin directo'}</small><span className="halftime-score">Descanso · {f.home.halftimeGoals ?? '—'} : {f.away.halftimeGoals ?? '—'}</span></div><Link to={`/equipos/${f.awayId}`}><Badge team={f.awayTeam} purple /><h2>{f.awayTeam.name}</h2><span>VISITANTE</span></Link></section><section className="panel match-stats"><div className="section-head"><div><h2>Estadísticas del encuentro</h2><p>Los datos ausentes se indican como “Sin datos”.</p></div></div><table><thead><tr><th>{f.homeTeam.shortName}</th><th>Métrica</th><th>{f.awayTeam.shortName}</th></tr></thead><tbody>{stats.map(({ key, label, digits }) => <tr key={key}><td>{f.home[key] == null ? 'Sin datos' : number(f.home[key] as number, digits ?? 0)}</td><th scope="row">{label}</th><td>{f.away[key] == null ? 'Sin datos' : number(f.away[key] as number, digits ?? 0)}</td></tr>)}</tbody></table></section><Source provenance={provenance} /></>;
}

function ShareButton({ values, disabled }: { values: Record<string, string>; disabled?: boolean }) {
  const [state, setState] = useState('');
  const [manual, setManual] = useState('');
  const selection = new URLSearchParams(values).toString();
  useEffect(() => { setState(''); setManual(''); }, [selection]);
  const copy = async () => {
    const url = new URL(window.location.href); url.search = selection;
    try { await navigator.clipboard.writeText(url.href); setState('Enlace copiado. Incluye equipos, división y filtros.'); }
    catch { setState('Selecciona y copia este enlace para compartir la misma consulta.'); setManual(url.href); }
  };
  return <div className="share-row"><button className="text-button" disabled={disabled} onClick={() => void copy()}><ArrowUpRight size={16} />Copiar enlace de esta comparación</button><span role="status" aria-live="polite">{state}</span>{manual && <input className="share-url" readOnly value={manual} aria-label="Enlace completo de la comparación" onFocus={(event) => event.target.select()} />}</div>;
}

function HomePage() {
  const catalog = useCatalog();
  return <>
    <section className="home-hero">
      <div className="hero-copy"><div className="eyebrow"><span className="small-cross">✳</span> FÚTBOL. DATOS. PERSPECTIVA.</div><h1>EL JUEGO CAMBIA.<br /><span>EL DATO CUENTA.</span></h1><p>Dos equipos. Una pregunta.<br />Pon goles, xG, tiros y tarjetas en contexto.</p><div className="hero-actions"><Link className="button primary" to="/comparador">Comparar equipos<ArrowRight size={19} /></Link><Link className="button" to="/equipos">Explorar equipos<ArrowUpRight size={18} /></Link></div></div>
      <div className="hero-pitch" aria-hidden="true"><div className="pitch-top"><span>MATCHIQ / VISIÓN DE JUEGO</span><span>↗</span></div><svg viewBox="0 0 300 260" fill="none"><rect x="24" y="15" width="252" height="225" rx="4" stroke="currentColor" strokeWidth="2"/><path d="M24 128h252M93 15v40h114V15M93 240v-40h114v40" stroke="currentColor" strokeWidth="2"/><circle cx="150" cy="128" r="34" stroke="currentColor" strokeWidth="2"/><path d="m59 186 58-44 50 14 70-64" stroke="#111" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="59" cy="186" r="7" fill="#111"/><circle cx="117" cy="142" r="7" fill="#111"/><circle cx="167" cy="156" r="7" fill="#111"/><circle cx="237" cy="92" r="9" fill="#7544db"/></svg><div className="pitch-bottom"><span>EL CONTEXTO<br />TAMBIÉN JUEGA.</span><img src="/brand/symbol.svg" width="44" height="44" alt="" /></div></div>
      <div className="hero-bottom"><span>01 / EXPLORA</span><span>02 / COMPARA</span><span>03 / ENTIENDE</span></div>
    </section>
    <section className="data-overview" aria-label="Contexto de los datos disponibles"><div><span>COMPETICIÓN</span><strong>{catalog.data?.competition.name ?? (catalog.isError ? 'Fuente no disponible' : 'Consultando…')}</strong></div><div><span>EQUIPOS DISPONIBLES</span><strong>{catalog.data?.teams.length ?? '—'}</strong></div><div><span>TEMPORADA MÁS RECIENTE</span><strong>{catalog.data?.seasons[0] ? seasonLabel(catalog.data.seasons[0]) : '—'}</strong></div><div><span>EN CADA ESTADÍSTICA</span><strong>Muestra + periodo</strong></div></section>
    <div className="home-cards"><article className="panel"><Database /><h2>DATOS CON CONTEXTO.</h2><p>Cada estadística incluye su muestra y periodo. Los datos ausentes no se convierten en ceros.</p></article><article className="panel"><ListFilter /><h2>TU PREGUNTA. TU FILTRO.</h2><p>Compara temporadas, últimos partidos y rendimiento local o visitante.</p></article><article className="panel"><Target /><h2>CLARIDAD EN EL CAMPO.</h2><p>{catalog.data?.provenance.mode === 'provider' ? 'Datos del proveedor con fuente y fecha de importación visibles. Sin afiliación con los clubes.' : catalog.data ? 'Los datos ficticios de demostración se identifican siempre como tales.' : 'La fuente y la fecha de importación acompañan a las estadísticas. Sin actualizaciones en directo.'}</p></article></div>
    <section className="home-method"><div><span className="eyebrow">ANTES DE SACAR CONCLUSIONES</span><h2>LEE LA MUESTRA.<br /><span>ENTIENDE EL NÚMERO.</span></h2><p>Una media de cinco partidos cuenta una historia distinta a una temporada completa. MatchIQ muestra qué estás comparando.</p><Link className="text-button" to="/comparador">Ponlo a prueba <ArrowRight size={17} /></Link></div><div className="method-questions"><details><summary>¿Qué estadísticas puedo comparar?</summary><p>Goles a favor y en contra, córners, amarillas, tiros totales, ambos equipos marcan y partidos con más de 2,5 goles, según los datos disponibles.</p></details><details><summary>¿Qué partidos entran en la muestra?</summary><p>Solo partidos finalizados en tiempo reglamentario de la temporada seleccionada. Primero se filtra local o visitante y después se eligen los últimos 5, 10 o 20.</p></details><details><summary>¿Qué ocurre si falta un dato?</summary><p>Se muestra como ausente y se excluye de la media correspondiente. Cada métrica indica cuántos partidos tienen dato; los ceros válidos sí cuentan.</p></details></div></section>
  </>;
}

export default function App() {
  return <Shell><Routes><Route path="/" element={<Navigate to="/inicio" replace />} /><Route path="/inicio" element={<HomePage />} /><Route path="/comparador" element={<ComparePage />} /><Route path="/equipos" element={<TeamsPage />} /><Route path="/equipos/:id" element={<TeamPage />} /><Route path="/partidos/:id" element={<FixturePage />} /><Route path="*" element={<div className="empty-state"><h1>FUERA DE JUEGO.</h1><p>Esta página no existe.</p><Link className="button primary" to="/comparador">Volver al comparador</Link></div>} /></Routes></Shell>;
}

