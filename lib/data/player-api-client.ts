import 'server-only';

import { extractApiError, tournamentFetch, TournamentApiError } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';

export interface GamertagAvailability {
  available: boolean;
  normalizedGamertag: string;
  validFormat: boolean;
}

export async function fetchMyGamertag(): Promise<string | null> {
  const { ok, status, body } = await tournamentFetch('/api/v1/players/me/profile');
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile leggere il profilo giocatore');
  }
  const data = unwrapApiPayload<{ gamertag?: unknown }>(body) ?? {};
  return typeof data.gamertag === 'string' ? data.gamertag : null;
}

export async function fetchGamertagAvailability(gamertag: string): Promise<GamertagAvailability> {
  const params = new URLSearchParams({ gamertag });
  const { ok, status, body } = await tournamentFetch(`/api/v1/players/gamertag-available?${params}`);
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile verificare la disponibilità del gamertag');
  }
  const data = unwrapApiPayload<Record<string, unknown>>(body) ?? {};
  return {
    available: data.available === true,
    normalizedGamertag: typeof data.normalized_gamertag === 'string' ? data.normalized_gamertag : '',
    validFormat: data.valid_format === true,
  };
}

export async function postSetGamertag(gamertag: string): Promise<string> {
  const { ok, status, body } = await tournamentFetch('/api/v1/players/me/profile', {
    method: 'PUT',
    body: JSON.stringify({ gamertag }),
  });
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile salvare il gamertag');
  }
  const data = unwrapApiPayload<{ gamertag?: unknown }>(body) ?? {};
  if (typeof data.gamertag !== 'string' || !data.gamertag) {
    throw new TournamentApiError('Risposta profilo non valida', 502, 'INVALID_RESPONSE');
  }
  return data.gamertag;
}

export type MatchOutcome = 'win' | 'loss' | 'abandoned' | 'disputed';

export interface RecentMatchResult {
  opponentGamertag: string | null;
  outcome: MatchOutcome;
  settledBy: string;
  durationSeconds: number;
  createdAt: string;
}

export interface ReputationSummary {
  played: number;
  wins: number;
  losses: number;
  abandoned: number;
  disputed: number;
  recent: RecentMatchResult[];
}

const VALID_OUTCOMES: MatchOutcome[] = ['win', 'loss', 'abandoned', 'disputed'];

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Aggregati di reputazione (Requisito 2) dal ledger match_results. */
export async function fetchMyReputation(): Promise<ReputationSummary> {
  const { ok, status, body } = await tournamentFetch('/api/v1/players/me/reputation');
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile leggere la reputazione');
  }
  const data = unwrapApiPayload<Record<string, unknown>>(body) ?? {};
  const recentRaw = Array.isArray(data.recent) ? data.recent : [];
  return {
    played: toNumber(data.played),
    wins: toNumber(data.wins),
    losses: toNumber(data.losses),
    abandoned: toNumber(data.abandoned),
    disputed: toNumber(data.disputed),
    recent: recentRaw.map((entry) => {
      const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const outcome =
        typeof row.outcome === 'string' && VALID_OUTCOMES.includes(row.outcome as MatchOutcome)
          ? (row.outcome as MatchOutcome)
          : 'disputed';
      return {
        opponentGamertag: typeof row.opponent_gamertag === 'string' ? row.opponent_gamertag : null,
        outcome,
        settledBy: typeof row.settled_by === 'string' ? row.settled_by : '',
        durationSeconds: toNumber(row.duration_seconds),
        createdAt: typeof row.created_at === 'string' ? row.created_at : '',
      };
    }),
  };
}

export { TournamentApiError };
