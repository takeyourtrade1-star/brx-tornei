import 'server-only';

import { mapMatchJudgeTurn } from '@/lib/data/match-judge-mapper';
import { extractApiError, TournamentApiError, tournamentFetch } from '@/lib/data/tournament-api-client';
import type { MatchJudgeTurn } from '@/types/tournament';
import type { MatchJudgeRequest } from '@/lib/validations/match-judge';

/**
 * Registra una domanda al Judge tramite il solo confine server-side del torneo.
 * Il backend risponde 202 (o replay 200) con il turno in `processing`: il
 * ruling arriva nello snapshot Tournament aggiornato via realtime/router.
 */
export async function postMatchJudge(
  matchId: string,
  input: MatchJudgeRequest,
): Promise<MatchJudgeTurn> {
  const { ok, status, body } = await tournamentFetch(
    `/api/v1/matches/${encodeURIComponent(matchId)}/judge`,
    { method: 'POST', body: JSON.stringify(input) },
  );
  if (!ok) {
    throw extractApiError(body, status, 'Impossibile chiedere un chiarimento al Judge');
  }
  const turn = mapMatchJudgeTurn(body);
  if (!turn) {
    throw new TournamentApiError('Conferma Judge non valida', 502, 'INVALID_RESPONSE');
  }
  return turn;
}
