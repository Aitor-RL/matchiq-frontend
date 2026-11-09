import { z } from 'zod';

export const filtersSchema = z.object({
  season: z.string().regex(/^(19|20)\d{2}$/).default('2024'),
  last: z.enum(['5', '10', '20']).default('10'),
  venue: z.enum(['all', 'home', 'away']).default('all'),
});
export const compareQuerySchema = filtersSchema.extend({
  a: z.string().min(1).max(32), b: z.string().min(1).max(32),
}).refine((q) => q.a !== q.b, { message: 'Selecciona dos equipos diferentes.', path: ['b'] });
export type Filters = z.infer<typeof filtersSchema>;
export type Team = { id: string; name: string; shortName: string; initials: string; city: string | null; founded: number | null };
export type SideStats = {
  goals: number | null; corners: number | null; yellows: number | null; shots: number | null;
  halftimeGoals?: number | null; expectedGoals?: number | null; shotsOnTarget?: number | null; fouls?: number | null; redCards?: number | null;
};
export type Fixture = {
  id: string; season: string; date: string; homeId: string; awayId: string;
  status: 'FT' | 'NS' | 'PST' | 'LIVE' | 'AET' | 'PEN' | 'CANC' | 'ABD' | 'SUSP' | 'AWD' | 'WO' | 'TBD' | 'OTHER'; home: SideStats; away: SideStats;
};
export type Metric = { value: number | null; valid: number; total: number; unit: 'por partido' | '%' };
export type MetricKey = 'goalsFor' | 'goalsAgainst' | 'halftimeGoalsFor' | 'halftimeGoalsAgainst' | 'xgFor' | 'xgAgainst' | 'corners' | 'yellows' | 'redCards' | 'shots' | 'shotsOnTarget' | 'fouls' | 'conversionRate' | 'btts' | 'over25';
export type TeamSummary = {
  teamId: string; total: number; metrics: Record<MetricKey, Metric>;
  results: { wins: number; draws: number; losses: number; valid: number };
  form: ('W' | 'D' | 'L')[];
  trend: { fixtureId: string; date: string; opponentId: string; goalsFor: number | null; goalsAgainst: number | null }[];
  fixtureIds: string[]; period: { from: string | null; to: string | null };
};
export type FixtureView = Fixture & { homeTeam: Team; awayTeam: Team };
export type Catalog = { teams: Team[]; competition: { id: string; name: string; country: string }; seasons: string[]; provenance: Provenance };
export type Provenance = { mode: 'synthetic' | 'provider'; source: string; updatedAt: string; note: string };
export type Dataset = { catalog: Catalog; fixtures: Fixture[]; provenance: Provenance };
export const fixtureStatusLabels: Record<Fixture['status'], string> = { FT: 'Finalizado', NS: 'Pendiente', PST: 'Aplazado', LIVE: 'En curso (último registro)', AET: 'Finalizado tras prórroga', PEN: 'Finalizado en penaltis', CANC: 'Cancelado', ABD: 'Abandonado', SUSP: 'Suspendido', AWD: 'Resultado adjudicado', WO: 'Incomparecencia', TBD: 'Fecha por determinar', OTHER: 'Estado no reconocido' };
export type Comparison = {
  filters: Filters; a: TeamSummary & { team: Team }; b: TeamSummary & { team: Team };
  headToHead: FixtureView[]; provenance: Provenance;
};
export type TeamDetail = { team: Team; summary: TeamSummary; fixtures: FixtureView[]; provenance: Provenance; filters: Filters };
export const aiInsightSchema = z.object({
  verdict: z.string().min(1).max(260),
  keyNarratives: z.array(z.object({ category: z.enum(['attack_vs_defense', 'tempo_and_discipline', 'sample_alert', 'recent_form']), title: z.string().min(1).max(80), explanation: z.string().min(1).max(260), edge: z.enum(['a', 'b', 'neutral']) })).max(4),
  matchFlow: z.string().min(1).max(320),
  confidenceScore: z.number().int().min(0).max(100),
  confidenceNote: z.string().min(1).max(160),
  source: z.enum(['openrouter', 'heuristic']),
  model: z.string().max(120).nullable(),
  fallbackReason: z.enum(['no_key', 'local_rate_limit', 'client_rate_limit', 'provider_paused', 'storage_unavailable', 'provider_auth', 'provider_rate_limit', 'provider_error', 'invalid_response', 'request_timeout', 'request_error']).optional(),
});
export type AiInsight = z.infer<typeof aiInsightSchema>;
export type AiAnalysis =
  | { status: 'empty' | 'pending'; insight: null }
  | { status: 'cached' | 'generated' | 'fallback'; insight: AiInsight };
export const metricLabels: Record<MetricKey, string> = {
  goalsFor: 'Goles a favor', goalsAgainst: 'Goles en contra', halftimeGoalsFor: 'Goles al descanso a favor', halftimeGoalsAgainst: 'Goles al descanso en contra',
  xgFor: 'xG a favor', xgAgainst: 'xG en contra', corners: 'Córners a favor', yellows: 'Tarjetas amarillas', redCards: 'Tarjetas rojas',
  shots: 'Tiros totales', shotsOnTarget: 'Tiros a puerta', fouls: 'Faltas cometidas', conversionRate: 'Conversión de tiros', btts: 'Ambos marcan', over25: 'Más de 2,5 goles',
};
