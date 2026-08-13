import 'server-only';

import { extractApiError, tournamentFetch } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';

export interface ReportSubmitResult {
  status: 'ok' | 'already_submitted';
}

/**
 * POST /api/v1/matches/{matchId}/reports
 * Segnalazione contro l'avversario con testo libero, esaminata dallo
 * staff. Il segnalato è derivato lato server; una segnalazione per
 * giocatore per match (la seconda risponde already_submitted).
 */
export async function submitMatchReport(
  matchId: string,
  message: string,
): Promise<ReportSubmitResult> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/reports`,
    { method: 'POST', body: JSON.stringify({ message }) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile inviare la segnalazione');
  }
  const data = unwrapApiPayload<{ status?: unknown }>(body) ?? {};
  return { status: data.status === 'already_submitted' ? 'already_submitted' : 'ok' };
}
