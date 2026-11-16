import { Trophy } from 'lucide-react';
import type { LeagueTable } from '@matchiq/shared';
import { Link } from '../navigation';

const firstDivision = [
  { label: 'Campeón', color: 'gold', from: 1, to: 1 },
  { label: 'Champions League', color: 'blue', from: 1, to: 4 },
  { label: 'Europa League', color: 'orange', from: 5, to: 5 },
  { label: 'Conference League', color: 'green', from: 6, to: 6 },
  { label: 'Descenso', color: 'red', from: 18, to: 20 },
];
const secondDivision = [
  { label: 'Ascenso a Primera División', color: 'dark-green', from: 1, to: 2 },
  { label: 'Promoción', color: 'light-green', from: 3, to: 6 },
  { label: 'Descenso', color: 'red', from: 19, to: 22 },
];

export function standingsZones(competitionId: string | undefined, position?: number) {
  const zones = competitionId === 'fd-SP1' ? firstDivision : competitionId === 'fd-SP2' ? secondDivision : [];
  return position === undefined ? zones : zones.filter(({ from, to }) => position >= from && position <= to);
}

export function TeamStandings({ table, teamId, season, cutoff, competitionId }: {
  table: LeagueTable; teamId: string; season: string; cutoff: string; competitionId?: string;
}) {
  const zones = standingsZones(competitionId);
  return <section className="panel standings-panel" id="clasificacion" aria-labelledby="standings-title">
    <div className="section-head"><div><h2 id="standings-title"><Trophy size={19} />Clasificación estimada</h2>
      <p>Temporada {season} · Partidos importados hasta el {cutoff}</p></div></div>
    {zones.length > 0 && <ul className="standings-legend" aria-label="Leyenda de la clasificación">
      {zones.map(({ label, color, from, to }) => <li className="team-position-zone" data-zone={color} key={label}>
        {from === to ? `${from}.º` : `${from}.º–${to}.º`} {label}
      </li>)}
    </ul>}
    <div className="table-scroll standings-scroll" role="region" aria-label="Tabla de clasificación desplazable" tabIndex={0}>
      <table className="standings-table">
        <thead><tr>
          <th scope="col"><abbr title="Posición">Pos.</abbr></th><th scope="col">Equipo</th>
          <th scope="col"><abbr title="Puntos">Pts</abbr></th><th scope="col"><abbr title="Partidos jugados">PJ</abbr></th>
          <th scope="col"><abbr title="Victorias">G</abbr></th><th scope="col"><abbr title="Empates">E</abbr></th>
          <th scope="col"><abbr title="Derrotas">P</abbr></th><th scope="col"><abbr title="Goles a favor">GF</abbr></th>
          <th scope="col"><abbr title="Goles en contra">GC</abbr></th><th scope="col"><abbr title="Diferencia de goles">DG</abbr></th>
        </tr></thead>
        <tbody>{table.rows.map((row) => {
          const current = row.teamId === teamId;
          const rowZones = standingsZones(competitionId, row.position);
          const difference = row.goalsFor - row.goalsAgainst;
          return <tr key={row.teamId} aria-current={current ? 'true' : undefined}>
            <td><span className="standings-rank" data-zone={rowZones[0]?.color}>{row.position}</span>
              {rowZones.length > 0 && <span className="sr-only">{rowZones.map(({ label }) => label).join(', ')}</span>}</td>
            <th scope="row">{current ? <>{row.team.name}<span className="sr-only">, equipo de esta ficha</span></>
              : <Link to={`/equipos/${row.teamId}`}>{row.team.name}</Link>}</th>
            <td className="standings-points">{row.points}</td><td>{row.wins + row.draws + row.losses}</td>
            <td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td>
            <td>{row.goalsFor}</td><td>{row.goalsAgainst}</td><td>{difference > 0 ? `+${difference}` : difference}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <p className="standings-note">Orden por puntos, diferencia de goles y goles a favor.</p>
  </section>;
}
