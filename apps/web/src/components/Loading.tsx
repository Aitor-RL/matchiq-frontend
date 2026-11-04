import { useEffect, useState } from 'react';

export function Spinner({ small = false }: { small?: boolean }) {
  return <span className={`brand-spinner ${small ? 'spinner-small' : ''}`} aria-hidden="true"><span /><span /><span /></span>;
}
export function Loading({ kind = 'comparison' }: { kind?: 'comparison' | 'teams' | 'team' | 'fixture' | 'chart' }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setSlow(true), 8000); return () => clearTimeout(timer); }, []);
  const label = { comparison: 'Preparando la comparación', teams: 'Cargando los equipos', team: 'Cargando la ficha del equipo', fixture: 'Cargando el partido', chart: 'Preparando la gráfica' }[kind];
  return <section className={`loading-view loading-${kind}`} aria-busy="true" aria-label={label}>
    <div className="loading-caption" role="status" aria-live="polite"><Spinner /><div><strong>{label}</strong><p>{slow ? 'Está tardando un poco más. Seguimos esperando la respuesta; no necesitas recargar.' : 'Cada cifra, con su contexto.'}</p></div></div>
    <div className="skeleton-layout" aria-hidden="true">
      {kind === 'teams' ? Array.from({ length: 6 }, (_, i) => <div className="skeleton-card" key={i}><i className="skeleton sk-badge" /><i className="skeleton sk-title" /><i className="skeleton sk-line" /></div>)
        : <><div className="skeleton-card"><i className="skeleton sk-badge" /><i className="skeleton sk-title" /><i className="skeleton sk-line" /></div><div className="skeleton-card"><i className="skeleton sk-badge" /><i className="skeleton sk-title" /><i className="skeleton sk-line" /></div><div className="skeleton-table">{Array.from({ length: kind === 'chart' ? 3 : 5 }, (_, i) => <div key={i}><i className="skeleton" /><i className="skeleton" /><i className="skeleton" /></div>)}</div></>}
    </div>
  </section>;
}
export function Updating({ stale = false }: { stale?: boolean }) {
  return <div className="updating-notice" role="status" aria-live="polite"><Spinner small /><span>{stale ? 'Actualizando selección. Los resultados visibles pertenecen a la consulta anterior.' : 'Actualizando los datos…'}</span></div>;
}
