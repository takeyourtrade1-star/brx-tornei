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

export interface FeedbackNotice {
  /** Timestamp ISO della prima valutazione di questo tipo ricevuta. */
  receivedAt: string;
}

export interface ReputationSummary {
  played: number;
  wins: number;
  losses: number;
  abandoned: number;
  disputed: number;
  recent: RecentMatchResult[];
  /** Storico completo (pagina /partite); oggi ricade sulla coda recent. */
  history: RecentMatchResult[];
  /** Presente solo entro 24 ore dalla prima valutazione negativa ricevuta. */
  negativeFeedbackNotice?: FeedbackNotice | null;
  /** Presente solo entro 24 ore dalla prima valutazione positiva ricevuta. */
  positiveFeedbackNotice?: FeedbackNotice | null;
}

const VALID_OUTCOMES: MatchOutcome[] = ['win', 'loss', 'abandoned', 'disputed'];

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/** Aggregati di reputazione (Requisito 2) dal ledger match_results. */
export async function fetchMyReputation(): Promise<ReputationSummary> {
  return fetchMyReputationPage();
}

/** Un elemento dello storico partite: stesso outcome del ledger, con data. */
export interface MatchHistoryEntry {
  opponentGamertag: string | null;
  outcome: MatchOutcome;
  settledBy: string;
  durationSeconds: number;
  createdAt: string;
}

/**
 * Storico partite completo (pagina /partite): oggi il backend espone gli
 * aggregati + le recenti; la pagina consuma la lista lunga se presente,
 * altrimenti ricade sulle recent del summary. I contatori sono da sempre
 * parte del contratto.
 */
export async function fetchMyReputationPage(): Promise<ReputationSummary> {
  const { ok, status, body } = await tournamentFetch('/api/v1/players/me/reputation');
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile leggere la reputazione');
  }
  const data = unwrapApiPayload<Record<string, unknown>>(body) ?? {};
  const recentRaw = Array.isArray(data.recent) ? data.recent : [];
  // Se il backend espone una lista lunga separata (storico completo) la
  // preferiamo; altrimenti la pagina usera' la coda recente.
  const historyRaw = Array.isArray(data.history) ? data.history : recentRaw;
  const mapNotice = (raw: unknown): FeedbackNotice | null => {
    const notice = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null;
    const receivedAt = notice?.received_at;
    return typeof receivedAt === 'string' && Number.isFinite(Date.parse(receivedAt))
      ? { receivedAt }
      : null;
  };
  const negativeFeedbackNotice = mapNotice(data.negative_feedback_notice);
  const positiveFeedbackNotice = mapNotice(data.positive_feedback_notice);
  const mapRow = (entry: unknown) => {
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
  };
  return {
    played: toNumber(data.played),
    wins: toNumber(data.wins),
    losses: toNumber(data.losses),
    abandoned: toNumber(data.abandoned),
    disputed: toNumber(data.disputed),
    recent: recentRaw.map(mapRow),
    history: historyRaw.map(mapRow),
    negativeFeedbackNotice,
    positiveFeedbackNotice,
  };
}

export { TournamentApiError };
