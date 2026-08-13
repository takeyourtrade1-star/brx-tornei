import 'server-only';

import { extractApiError, tournamentFetch } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import { MATCH_BADGE_BY_ID } from '@/lib/data/match-badge-catalog';
import type {
  EndFeedbackInput,
  MatchBadgeId,
  MatchConnectionLevel,
} from '@/lib/validations/match-feedback';

/** Risultato di una submission: il backend la rende idempotente. */
export interface FeedbackSubmitResult {
  status: 'ok' | 'already_submitted';
}

export interface MatchFeedbackSummary {
  /** Badge ricevuti dagli avversari, con conteggio per tipo. */
  badges: { badge: MatchBadgeId; count: number }[];
  /** Distribuzione dei rapporti di connessione inviati da me. */
  connectionReports: Record<MatchConnectionLevel, number>;
}

/**
 * POST /api/v1/matches/{matchId}/end-feedback
 * Rapporto di battaglia dopo una chiusura per abbandono/disconnessione.
 * Una submission per giocatore per match; la risposta può indicare
 * `already_submitted` se il giocatore aveva già inviato il rapporto.
 */
export async function submitEndFeedback(
  matchId: string,
  input: EndFeedbackInput,
): Promise<FeedbackSubmitResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/end-feedback`,
    {
      method: 'POST',
      body: JSON.stringify({
        disconnect_confirmed: input.disconnectConfirmed,
        connection: input.connection,
      }),
    },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile inviare il rapporto di fine partita');
  }
  const data = unwrapApiPayload<{ status?: unknown }>(body) ?? {};
  return { status: data.status === 'already_submitted' ? 'already_submitted' : 'ok' };
}

/**
 * POST /api/v1/matches/{matchId}/opponent-badge
 * Titolo consegnato all'avversario a partita conclusa regolarmente.
 * Una submission per giocatore per match, con lo stesso contratto
 * di idempotenza del rapporto.
 */
export async function submitOpponentBadge(
  matchId: string,
  badge: MatchBadgeId,
): Promise<FeedbackSubmitResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/opponent-badge`,
    { method: 'POST', body: JSON.stringify({ badge }) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile consegnare il titolo all’avversario');
  }
  const data = unwrapApiPayload<{ status?: unknown }>(body) ?? {};
  return { status: data.status === 'already_submitted' ? 'already_submitted' : 'ok' };
}

/**
 * GET /api/v1/players/me/match-feedback
 * Riepilogo delle valutazioni in-game: badge ricevuti e distribuzione
 * dei rapporti di connessione inviati.
 */
export async function fetchMyMatchFeedback(): Promise<MatchFeedbackSummary> {
  const { ok, status, body } = await tournamentFetch('/api/v1/players/me/match-feedback');
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile leggere le valutazioni in-game');
  }
  const data = unwrapApiPayload<Record<string, unknown>>(body) ?? {};
  const badgesRaw = Array.isArray(data.badges) ? data.badges : [];
  const badges = badgesRaw
    .map((entry) => {
      const row = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
      const badgeId = row.badge;
      const count = typeof row.count === 'number' && Number.isFinite(row.count) ? row.count : 0;
      return MATCH_BADGE_BY_ID.has(badgeId as MatchBadgeId)
        ? { badge: badgeId as MatchBadgeId, count }
        : null;
    })
    .filter((entry): entry is { badge: MatchBadgeId; count: number } => entry !== null);

  const reportsRaw =
    data.connection_reports && typeof data.connection_reports === 'object'
      ? (data.connection_reports as Record<string, unknown>)
      : {};
  const toCount = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

  return {
    badges,
    connectionReports: {
      smooth: toCount(reportsRaw.smooth),
      some_issues: toCount(reportsRaw.some_issues),
      poor: toCount(reportsRaw.poor),
    },
  };
}
