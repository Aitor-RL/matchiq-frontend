import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BrainCircuit, RefreshCw, Sparkles } from 'lucide-react';
import type { AiAnalysis, AiInsight, Comparison } from '@matchiq/shared';
import { generateAnalysis, get } from '../api';

const categoryLabels: Record<AiInsight['keyNarratives'][number]['category'], string> = {
  attack_vs_defense: 'Ataque y defensa',
  tempo_and_discipline: 'Volumen y disciplina',
  sample_alert: 'Tamaño de muestra',
  recent_form: 'Forma reciente',
};

const fallbackLabels: Record<NonNullable<AiInsight['fallbackReason']>, string> = {
  no_key: 'OpenRouter aún no está configurado.',
  local_rate_limit: 'MatchIQ ha alcanzado su límite de análisis nuevos.',
  client_rate_limit: 'Has alcanzado el límite de 3 análisis nuevos al día desde esta conexión.',
  provider_paused: 'La generación con IA está en pausa. Puedes volver a intentarlo más tarde.',
  storage_unavailable: 'El sistema de caché y límites no está disponible.',
  provider_auth: 'OpenRouter rechazó la configuración de acceso.',
  provider_rate_limit: 'OpenRouter ha limitado temporalmente las llamadas.',
  provider_error: 'OpenRouter devolvió un error.',
  invalid_response: 'La respuesta de OpenRouter no tenía el formato esperado.',
  request_timeout: 'OpenRouter tardó demasiado en responder.',
  request_error: 'No se pudo completar la conexión con OpenRouter.',
};

export default function AIReportPanel({ comparison, competition, path, season }: {
  comparison: Comparison; competition?: string; path: string; season: string;
}) {
  const client = useQueryClient();
  const queryKey = ['ai-insight', competition, path, comparison.provenance.updatedAt];
  const saved = useQuery({
    queryKey,
    queryFn: ({ signal }) => get<AiAnalysis>(path, signal, competition),
    staleTime: 60_000,
    refetchInterval: (query) => query.state.data?.status === 'pending' && !query.state.error ? 3000 : false,
  });
  const generation = useMutation({
    mutationFn: () => generateAnalysis<AiAnalysis>(path, competition),
    onSuccess: async (result) => {
      await client.cancelQueries({ queryKey, exact: true });
      client.setQueryData(queryKey, result);
    },
  });

  const result = saved.data;
  const insight = result?.insight;
  const pending = result?.status === 'pending';
  const loading = generation.isPending || (pending && !saved.isError);
  const error = generation.error ?? saved.error;
  const { a, b, filters } = comparison;
  const hasSample = a.total > 0 && b.total > 0;
  const venue = { all: 'Local y visitante', home: 'Solo como local', away: 'Solo como visitante' }[filters.venue];
  const source = result?.status === 'cached' ? 'IA · informe guardado'
    : insight?.source === 'openrouter' ? 'IA · generado con OpenRouter'
    : insight ? 'Resumen automático de MatchIQ' : null;

  return <section className="reading-panel ai-report" aria-labelledby="ai-report-title">
    <header className="ai-header">
      <div>
        <div className="reading-label"><span className="reading-icon"><BrainCircuit size={18} /></span>COMPARADOR</div>
        <h2 id="ai-report-title">Análisis IA</h2>
        <p>{a.team.name} · {b.team.name} · {season} · Últimos {filters.last} · {venue}</p>
      </div>
      {source && <span className="tag">{source}</span>}
    </header>

    <div aria-live="polite">
      {saved.isPending && <p className="ai-mode-note">Buscando un informe guardado…</p>}
      {loading && <p className="ai-mode-note" role="status"><RefreshCw size={14} className="spin" aria-hidden="true" /> Generando el análisis…</p>}
      {!hasSample && <p>Los dos equipos necesitan partidos en la selección para generar el análisis.</p>}
      {insight && <>
        <p className="ai-verdict">{insight.verdict}</p>
        <p className="ai-mode-note">
          Muestra: {a.total} partidos de {a.team.shortName} y {b.total} de {b.team.shortName}.
          {' '}Tiros disponibles: {a.metrics.shots.valid}/{a.total} y {b.metrics.shots.valid}/{b.total}.
        </p>
        {!!insight.keyNarratives.length && <div className="ai-narratives">
          {insight.keyNarratives.slice(0, 3).map((item, index) => <article className={`ai-narrative edge-${item.edge}`} key={`${item.category}-${index}`}>
            <span>{categoryLabels[item.category]}</span>
            <h3>{item.title}</h3>
            <p>{item.explanation}</p>
          </article>)}
        </div>}
        <details className="ai-details">
          <summary>Ver análisis completo</summary>
          {insight.keyNarratives.slice(3).map((item, index) => <p key={index}><strong>{item.title}.</strong> {item.explanation}</p>)}
          <p>{insight.matchFlow}</p>
          <p>{insight.confidenceNote}</p>
          {insight.model && <p>Modelo: {insight.model}.</p>}
        </details>
        {insight.fallbackReason && <p className="ai-mode-note">{fallbackLabels[insight.fallbackReason]}</p>}
      </>}
      {error && <p className="ai-error" role="alert">{error.message}</p>}
    </div>

    {hasSample && insight?.source !== 'openrouter' && !saved.isPending && !pending && !saved.isError &&
      <button type="button" className="button ai-generate" disabled={loading || saved.isFetching} onClick={() => generation.mutate()}>
        <Sparkles size={16} aria-hidden="true" /> {insight ? 'Reintentar con IA' : 'Generar análisis IA'}
      </button>}
    {saved.isError && <button type="button" className="button ai-generate" disabled={saved.isFetching} onClick={() => void saved.refetch()}>
      Comprobar informe guardado
    </button>}
  </section>;
}
