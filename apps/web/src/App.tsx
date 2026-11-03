import { useId, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftRight, ArrowUpRight, BarChart3, CalendarDays, Check, ChevronDown, CircleHelp, Database, FlaskConical, Info, ListFilter, RotateCcw, Search, SlidersHorizontal, Target, Trophy, X } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { filtersSchema, fixtureStatusLabels, metricLabels, type Catalog, type Comparison, type Filters, type FixtureView, type Metric, type MetricKey, type Provenance, type Team, type TeamDetail, type TeamSummary } from '@matchiq/shared';
import { get, useCatalog } from './api';

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
function Loading() {
  return <div className="loading-panel" role="status"><Activity size={24} /><p>Cargando el análisis…</p><div className="skeleton" /><div className="skeleton" /><div className="skeleton" /></div>;
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
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <header className="site-header"><div className="header-inner">
      <Link to="/inicio" className="wordmark" aria-label="MatchIQ, inicio"><span>MATCH<span className="iq">IQ</span></span><span className="logo-dot" /></Link>
      <nav aria-label="Navegación principal"><NavLink to="/inicio">Inicio</NavLink><NavLink to="/equipos">Equipos</NavLink><NavLink to="/comparador"><ArrowLeftRight size={17} />Comparador</NavLink></nav>
      <div className="header-end">{catalog.data?.competition.id.startsWith('fd-') && <SelectField label="División" value={catalog.data.competition.id} onChange={(value) => { localStorage.setItem('matchiq-competition', value); window.location.assign('/comparador'); }}><option value="fd-SP1">Primera División</option><option value="fd-SP2">Segunda División</option></SelectField>}<span className="local-status"><i /> Versión local</span><button className="icon-button" aria-label="Información de la demo" aria-expanded={showInfo} onClick={() => setShowInfo(!showInfo)}>{showInfo ? <X size={20} /> : <CircleHelp size={20} />}</button></div>
    </div></header>
    {showInfo && <aside className="info-drawer"><div><strong>Estás probando MatchIQ.</strong><p>{catalog.data?.provenance.note ?? 'Consultando el estado de los datos.'}</p><p>Los cálculos excluyen los valores ausentes y solo incluyen partidos finalizados en tiempo reglamentario. No hay actualización en directo.</p><p>MatchIQ es una plataforma independiente, sin afiliación ni patrocinio de clubes o competiciones. Los emblemas con iniciales son gráficos propios, no escudos oficiales.</p></div></aside>}
    <div className="demo-strip"><FlaskConical size={14} /><strong>{!catalog.data ? 'ESTADO DE DATOS' : synthetic ? 'DATOS SINTÉTICOS' : 'DATOS IMPORTADOS'}</strong><span>{!catalog.data ? 'Consultando la API local' : synthetic ? 'Entorno de prueba · Equipos y resultados ficticios' : `${catalog.data.competition.name} · Fuente: ${catalog.data.provenance.source}`}</span><span className="strip-end">SIN ACTUALIZACIÓN EN DIRECTO <span aria-hidden="true">↗</span></span></div>
    <main id="contenido" className="page-container">{children}</main>
    <footer className="site-footer"><Link className="footer-logo" to="/inicio">MATCHIQ<span aria-hidden="true">✳</span></Link><span>Plataforma independiente · Sin afiliación oficial.</span><span className="footer-demo"><FlaskConical size={13} /> {synthetic ? 'DEMO LOCAL' : 'DATOS IMPORTADOS'} · V0.2</span></footer>
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
    Object.entries(patch).forEach(([key, value]) => next.set(key, value));
    setParams(next);
  };
  return { params, filters, update, invalid: !parsed.success || !!(catalog.data && !catalog.data.seasons.includes(filters.season)), reset: () => setParams({ ...defaults, a: catalog.data?.teams.find((t) => t.id === defaults.a)?.id ?? catalog.data?.teams[0]?.id ?? defaults.a, b: catalog.data?.teams.find((t) => t.id === defaults.b)?.id ?? catalog.data?.teams[1]?.id ?? defaults.b, season: defaultSeason }) };
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = useId();
  return <div className="select-field"><label htmlFor={id}>{label}</label><span className="select-wrap"><select id={id} value={value} onChange={(e) => onChange(e.target.value)}>{children}</select><ChevronDown size={16} aria-hidden="true" /></span></div>;
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
  return <div className="metric-value"><strong>{number(metric.value, metric.unit === '%' ? 0 : 1)}{metric.unit === '%' && metric.value !== null ? <small>%</small> : null}</strong><span>{metric.valid}/{metric.total} con dato</span></div>;
}
function MetricComparison({ data }: { data: Comparison }) {
  const keys: MetricKey[] = ['goalsFor', 'goalsAgainst', 'corners', 'yellows', 'shots', 'btts', 'over25'];
  return <section className="panel metrics-panel" aria-labelledby="metrics-title"><div className="section-head"><h2 id="metrics-title"><BarChart3 size={19} />Frente a frente</h2><span className="eyebrow">MEDIAS Y PORCENTAJES</span></div>
    <div className="metrics-column-labels"><span><i className="dot green" />{data.a.team.shortName}</span><span>MÉTRICA</span><span>{data.b.team.shortName}<i className="dot purple-dot" /></span></div>
    {keys.map((key) => {
      const a = data.a.metrics[key], b = data.b.metrics[key];
      const max = Math.max(a.value ?? 0, b.value ?? 0, 1);
      return <div className="metric-row" key={key}>
        <MetricValue metric={a} /><div className="metric-center"><h3>{metricLabels[key]}</h3><span>{a.unit === '%' ? 'Porcentaje de partidos' : 'Media por partido'}</span><div className="comparison-track" aria-hidden="true"><div className="track-a"><i style={{ width: `${((a.value ?? 0) / max) * 100}%` }} /></div><div className="track-b"><i style={{ width: `${((b.value ?? 0) / max) * 100}%` }} /></div></div></div><MetricValue metric={b} />
      </div>;
    })}
    <div className="metrics-foot"><Info size={14} /><span>Las medias excluyen los datos ausentes. Los ceros válidos sí cuentan.</span></div>
  </section>;
}

function TrendChart({ summary }: { summary: Comparison['a'] | (TeamSummary & { team: Team }) }) {
  const [showTable, setShowTable] = useState(false);
  return <section className="panel trend-panel"><div className="section-head"><div><h2><Activity size={18} />El pulso del equipo</h2><p>{summary.team.name} · Goles por encuentro</p></div><span className="tag">{summary.total} PARTIDOS</span></div>
    <div className="trend-chart" role="img" aria-label={`Goles a favor y en contra de ${summary.team.name}, ordenados del partido más antiguo al más reciente. Tabla de datos disponible debajo.`}>
      <ResponsiveContainer width="100%" height="100%"><LineChart data={summary.trend} margin={{ top: 12, right: 14, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dedfd8" /><XAxis dataKey="date" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#51564f' }} minTickGap={22} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#51564f' }} domain={[0, 'auto']} />
        <Tooltip labelFormatter={(value) => date(String(value))} contentStyle={{ border: '2px solid #111', borderRadius: 10, fontFamily: 'Barlow' }} /><Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
        <Line type="linear" dataKey="goalsFor" name="A favor" stroke="#477514" strokeWidth={3} dot={{ r: 3, fill: '#c5f451' }} isAnimationActive={false} connectNulls={false} />
        <Line type="linear" dataKey="goalsAgainst" name="En contra" stroke="#7544db" strokeDasharray="5 4" strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
      </LineChart></ResponsiveContainer>
    </div><button className="text-button chart-table-toggle" aria-expanded={showTable} onClick={() => setShowTable(!showTable)}>{showTable ? 'Ocultar' : 'Ver'} tabla de datos <ChevronDown size={13} /></button>
    {showTable && <div className="table-scroll"><table><caption>Goles de {summary.team.name}, del más antiguo al más reciente</caption><thead><tr><th>Fecha</th><th>A favor</th><th>En contra</th></tr></thead><tbody>{summary.trend.map((f) => <tr key={f.fixtureId}><td>{date(f.date)}</td><td>{f.goalsFor ?? 'Sin datos'}</td><td>{f.goalsAgainst ?? 'Sin datos'}</td></tr>)}</tbody></table></div>}
  </section>;
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
  const catalog = useCatalog();
  const { params, filters, update, reset, invalid } = useFilters();
  const a = params.get('a') || catalog.data?.teams.find((t) => t.id === defaults.a)?.id || catalog.data?.teams[0]?.id || defaults.a, b = params.get('b') || catalog.data?.teams.find((t) => t.id === defaults.b)?.id || catalog.data?.teams[1]?.id || defaults.b;
  const [tab, setTab] = useState<'metrics' | 'history'>('metrics');
  const query = new URLSearchParams({ ...filters, a, b }).toString();
  const comparison = useQuery({ queryKey: ['compare', query], queryFn: ({ signal }) => get<Comparison>(`compare?${query}`, signal), enabled: !invalid && !!catalog.data && catalog.data.teams.length >= 2 });
  return <>
    <div className="page-heading"><div><div className="eyebrow"><span className="small-cross">✳</span> EL FÚTBOL, CON PERSPECTIVA</div><h1>COMPARA EL <span>JUEGO.</span></h1><p>Dos equipos. La misma lupa. Tú sacas las conclusiones.</p></div><div className="heading-index"><span>LAB / 001</span><ArrowDown size={24} /></div></div>
    {catalog.isPending ? <Loading /> : catalog.isError ? <ErrorPanel message={catalog.error.message} retry={() => void catalog.refetch()} /> : <div className="workspace-grid">
      <FilterPanel catalog={catalog.data} a={a} b={b} filters={filters} update={update} reset={reset} />
      <div className="comparison-content">
        {catalog.data.teams.length < 2 ? <p className="empty-state">Se necesitan al menos dos equipos importados para comparar.</p> : invalid ? <ErrorPanel message="Los filtros del enlace no son válidos. Restablécelos para continuar." retry={reset} /> : comparison.isPending ? <Loading /> : comparison.isError ? <ErrorPanel message={comparison.error.message} retry={() => void comparison.refetch()} /> : <>
          <div className="context-row"><span><Trophy size={14} />{catalog.data.competition.name.toLocaleUpperCase('es')} <span className="context-slash">/</span> {seasonLabel(filters.season)}</span><span><CalendarDays size={14} />Últimos {filters.last} · {filters.venue === 'all' ? 'Local + visitante' : filters.venue === 'home' ? 'Como local' : 'Como visitante'}</span></div>
          <div className="team-cards"><TeamCard summary={comparison.data.a} side="A" /><span className="versus" aria-hidden="true">VS</span><TeamCard summary={comparison.data.b} side="B" /></div>
          <div className="analysis-tabs" role="group" aria-label="Vista del análisis"><button aria-pressed={tab === 'metrics'} onClick={() => setTab('metrics')}><BarChart3 size={16} />Estadísticas</button><button aria-pressed={tab === 'history'} onClick={() => setTab('history')}><ArrowLeftRight size={16} />Enfrentamientos <span>{comparison.data.headToHead.length}</span></button><span className="sample-status"><i />MUESTRA DISPONIBLE</span></div>
          {tab === 'metrics' ? <><MetricComparison data={comparison.data} /><div className="bottom-grid"><TrendChart summary={comparison.data.a} /><Reading data={comparison.data} /></div></> : <section className="panel"><div className="section-head"><div><h2>Historial entre equipos</h2><p>Todos sus enfrentamientos finalizados de {seasonLabel(filters.season)}. Independiente del filtro de últimos partidos y condición.</p></div></div><FixtureList fixtures={comparison.data.headToHead} /></section>}
          <div className="sample-periods"><span><strong>{comparison.data.a.team.shortName}:</strong> {comparison.data.a.period.from ? `${date(comparison.data.a.period.from)} — ${date(comparison.data.a.period.to!)}` : 'Sin partidos'}</span><span><strong>{comparison.data.b.team.shortName}:</strong> {comparison.data.b.period.from ? `${date(comparison.data.b.period.from)} — ${date(comparison.data.b.period.to!)}` : 'Sin partidos'}</span></div>
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
  return <><div className="page-heading"><div><div className="eyebrow">EL PUNTO DE PARTIDA</div><h1>CADA EQUIPO,<br /><span>SU HISTORIA.</span></h1><p>{catalog.data?.provenance.mode === 'provider' ? 'Explora los equipos disponibles en la competición importada.' : 'Explora los seis equipos ficticios del laboratorio MatchIQ.'}</p></div><Trophy className="heading-symbol" size={76} strokeWidth={1.3} /></div>
    <label className="search-box"><Search size={21} /><span className="sr-only">Buscar equipos</span><input placeholder="Busca un equipo…" value={search} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} /><span>{filtered.length} equipos</span></label>
    {catalog.isPending ? <Loading /> : catalog.isError ? <ErrorPanel message={catalog.error.message} retry={() => void catalog.refetch()} /> : <><div className="teams-grid">{filtered.map((team, i) => <Link to={`/equipos/${team.id}`} key={team.id} className={`team-directory-card ${i % 2 ? 'directory-purple' : ''}`}><div className="directory-top"><span>{catalog.data.provenance.mode === 'provider' ? 'CLUB · DATOS IMPORTADOS' : 'CLUB DE PRUEBA'}</span><ArrowUpRight size={20} /></div><Badge team={team} purple={i % 2 === 1} /><h2>{team.name}</h2><p>{team.city ?? 'Ciudad no disponible'}</p><div className="directory-bottom"><span>VER EQUIPO</span><span>→</span></div></Link>)}</div>{!filtered.length && <div className="empty-state"><Search /><h2>No encontramos ese equipo</h2><p>Prueba con otro nombre o consulta todos los equipos disponibles.</p><button className="button" onClick={() => setParams({})}>Ver todos</button></div>}</>}
  </>;
}

function TeamPage() {
  const { id } = useParams();
  const catalog = useCatalog();
  const { filters, update, invalid, reset } = useFilters();
  const query = new URLSearchParams(filters).toString();
  const detail = useQuery({ queryKey: ['team', id, query], queryFn: ({ signal }) => get<TeamDetail>(`teams/${id}?${query}`, signal), enabled: !invalid && !!catalog.data });
  if (invalid) return <ErrorPanel message="Los filtros del enlace no son válidos." retry={reset} />;
  if (detail.isPending) return <Loading />;
  if (detail.isError) return <ErrorPanel message={detail.error.message} retry={() => void detail.refetch()} />;
  const { team, summary, fixtures, provenance } = detail.data;
  const synthetic = provenance.mode === 'synthetic';
  const opponent = catalog.data?.teams.find((t) => t.id !== team.id);
  return <><Link className="back-link" to="/equipos"><ArrowLeft size={16} />Todos los equipos</Link><div className="team-profile-heading"><Badge team={team} /><div><div className="eyebrow">{synthetic ? 'EQUIPO FICTICIO' : 'DATOS IMPORTADOS'} · {catalog.data?.competition.name.toLocaleUpperCase('es')}</div><h1>{team.name}</h1><p>{team.city ?? 'Ciudad no disponible'} · {team.founded === null ? 'Fundación no disponible' : `${synthetic ? 'Fundación ficticia' : 'Fundación'}: ${team.founded}`}</p></div><Link className="button primary" to={`/comparador?a=${team.id}&b=${opponent?.id ?? ''}&${query}`}><ArrowLeftRight size={17} />Comparar equipo</Link></div>
    <div className="profile-filters"><SelectField label="Temporada" value={filters.season} onChange={(season) => update({ season })}>{catalog.data?.seasons.map((season) => <option key={season} value={season}>{seasonLabel(season)}{synthetic ? ' · demo' : ''}</option>)}</SelectField><SelectField label="Muestra" value={filters.last} onChange={(last) => update({ last })}><option value="5">Últimos 5</option><option value="10">Últimos 10</option><option value="20">Últimos 20</option></SelectField><SelectField label="Condición" value={filters.venue} onChange={(venue) => update({ venue })}><option value="all">Local y visitante</option><option value="home">Solo local</option><option value="away">Solo visitante</option></SelectField><div><span className="eyebrow">FORMA RECIENTE</span><Form values={summary.form} /></div></div>
    <div className="profile-metrics">{(['goalsFor', 'goalsAgainst', 'corners', 'yellows'] as MetricKey[]).map((key) => <article className="panel mini-metric" key={key}><span>{metricLabels[key]}</span><strong>{number(summary.metrics[key].value)}</strong><small>por partido · {summary.metrics[key].valid}/{summary.total} con dato</small></article>)}</div>
    <div className="profile-grid"><section className="panel"><div className="section-head"><div><h2>Resultados disponibles</h2><p>{summary.total} partidos finalizados · {seasonLabel(filters.season)}</p></div><CalendarDays size={19} /></div><FixtureList fixtures={fixtures} /></section><TrendChart summary={{ ...summary, team }} /></div><Source provenance={provenance} />
  </>;
}

function FixturePage() {
  const { id } = useParams();
  const detail = useQuery({ queryKey: ['fixture', id], queryFn: ({ signal }) => get<{ fixture: FixtureView; provenance: Provenance }>(`fixtures/${id}`, signal) });
  if (detail.isPending) return <Loading />;
  if (detail.isError) return <ErrorPanel message={detail.error.message} retry={() => void detail.refetch()} />;
  const { fixture: f, provenance } = detail.data;
  const synthetic = provenance.mode === 'synthetic';
  return <><Link className="back-link" to="/equipos"><ArrowLeft size={16} />Explorar equipos</Link><div className="page-heading"><div><div className="eyebrow">{synthetic ? 'PARTIDO SINTÉTICO' : 'REGISTRO DEL PROVEEDOR'} · {seasonLabel(f.season)}</div><h1>EL PARTIDO,<br /><span>AL DETALLE.</span></h1><p>{date(f.date)} · {provenance.source}</p></div></div><section className="match-scoreboard"><Link to={`/equipos/${f.homeId}`}><Badge team={f.homeTeam} /><h2>{f.homeTeam.name}</h2><span>LOCAL</span></Link><div><span className="tag">{fixtureStatusLabels[f.status].toLocaleUpperCase('es')}</span><strong>{f.home.goals ?? '—'} : {f.away.goals ?? '—'}</strong><small>{synthetic ? 'Resultado ficticio' : 'Marcador registrado · Sin directo'}</small></div><Link to={`/equipos/${f.awayId}`}><Badge team={f.awayTeam} purple /><h2>{f.awayTeam.name}</h2><span>VISITANTE</span></Link></section><section className="panel match-stats"><div className="section-head"><h2>Estadísticas del encuentro</h2></div><table><thead><tr><th>{f.homeTeam.shortName}</th><th>Métrica</th><th>{f.awayTeam.shortName}</th></tr></thead><tbody>{(['goals', 'corners', 'yellows', 'shots'] as const).map((key) => <tr key={key}><td>{f.home[key] ?? 'Sin datos'}</td><th scope="row">{{ goals: 'Goles', corners: 'Córners', yellows: 'Amarillas', shots: 'Tiros' }[key]}</th><td>{f.away[key] ?? 'Sin datos'}</td></tr>)}</tbody></table></section><Source provenance={provenance} /></>;
}

function HomePage() {
  const catalog = useCatalog();
  return <><div className="home-hero"><div className="eyebrow"><span className="small-cross">✳</span> LABORATORIO DE ANÁLISIS DE FÚTBOL</div><h1>MENOS CORAZONADAS.<br /><span>MÁS FÚTBOL.</span></h1><p>Explora los resultados. Encuentra el contexto.<br />Entiende lo que pasa sobre el césped, un dato a la vez.</p><div className="hero-actions"><Link className="button primary" to="/comparador">Comparar equipos<ArrowRight size={19} /></Link><Link className="button" to="/equipos">Explorar equipos<ArrowUpRight size={18} /></Link></div><div className="hero-bottom"><span>01 / EXPLORA</span><span>02 / COMPARA</span><span>03 / ENTIENDE</span></div></div><div className="home-cards"><article className="panel"><Database /><h2>DATOS CON CONTEXTO.</h2><p>Cada estadística incluye su muestra y periodo. Los datos ausentes no se convierten en ceros.</p></article><article className="panel"><ListFilter /><h2>TU PREGUNTA. TU FILTRO.</h2><p>Compara temporadas, últimos partidos y rendimiento local o visitante.</p></article><article className="panel"><FlaskConical /><h2>UN LABORATORIO ABIERTO.</h2><p>{catalog.data?.provenance.mode === 'provider' ? 'Datos del proveedor con fuente y fecha de importación visibles. Sin afiliación con los clubes.' : 'Esta versión usa clubes ficticios para que pruebes los cálculos y la experiencia.'}</p></article></div></>;
}

export default function App() {
  return <Shell><Routes><Route path="/" element={<Navigate to="/comparador" replace />} /><Route path="/inicio" element={<HomePage />} /><Route path="/comparador" element={<ComparePage />} /><Route path="/equipos" element={<TeamsPage />} /><Route path="/equipos/:id" element={<TeamPage />} /><Route path="/partidos/:id" element={<FixturePage />} /><Route path="*" element={<div className="empty-state"><h1>FUERA DE JUEGO.</h1><p>Esta página no existe.</p><Link className="button primary" to="/comparador">Volver al comparador</Link></div>} /></Routes></Shell>;
}
