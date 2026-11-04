import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Comparison, TeamSummary, Team } from '@matchiq/shared';
const date=(s:string)=>new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(s));
const shortDate=(s:string)=>new Intl.DateTimeFormat('es-ES',{day:'2-digit',month:'short',timeZone:'Europe/Madrid'}).format(new Date(s));
export default function TrendChart({ summary }: { summary: Comparison['a'] | (TeamSummary & { team: Team }) }) {
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

