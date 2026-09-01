'use server';

import { getSession } from '@/lib/auth/session';
import { postMatchJudge } from '@/lib/data/match-judge';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import type { MatchJudgeTurn } from '@/types/tournament';
import {
  matchJudgeMatchIdSchema,
  matchJudgeRequestSchema,
} from '@/lib/validations/match-judge';

export type MatchJudgeActionState =
  | { ok: true; turn: MatchJudgeTurn }
  | { ok: false; error: string; errorCode?: string; status?: number };

function mapJudgeError(error: unknown): MatchJudgeActionState {
  if (error instanceof TournamentApiError) {
    const messages: Record<string, string> = {
      JUDGE_BUSY: 'Asso sta già verificando una domanda. Attendi la risposta.',
      API_NOT_CONFIGURED: 'Servizio Judge non configurato.',
      API_UNAVAILABLE: 'Il Judge non è raggiungibile. Riprova tra poco.',
      UNAUTHORIZED: 'Sessione scaduta: effettua di nuovo il login.',
      INVALID_RESPONSE: 'Risposta Judge non valida. Riprova tra poco.',
    };
    return {
      ok: false,
      error: (error.code && messages[error.code]) || 'Impossibile consultare il Judge.',
      errorCode: error.code,
      status: error.status,
    };
  }
  return { ok: false, error: 'Impossibile consultare il Judge.' };
}

/** Server Action autenticata: il browser non chiama direttamente il backend. */
export async function askMatchJudgeAction(
  matchId: unknown,
  input: unknown,
): Promise<MatchJudgeActionState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Sessione scaduta: effettua di nuovo il login.', errorCode: 'UNAUTHORIZED', status: 401 };
  }
  const parsedMatchId = matchJudgeMatchIdSchema.safeParse(matchId);
  if (!parsedMatchId.success) {
    return { ok: false, error: 'Partita non valida.', errorCode: 'INVALID_MATCH_ID', status: 400 };
  }
  const parsedInput = matchJudgeRequestSchema.safeParse(input);
  if (!parsedInput.success) {
    return {
      ok: false,
      error: parsedInput.error.issues[0]?.message ?? 'Domanda non valida.',
      errorCode: 'INVALID_QUESTION',
      status: 400,
    };
  }
  try {
    const answer = await postMatchJudge(parsedMatchId.data, parsedInput.data);
    return {
      ok: true,
      turn: {
        ...answer,
        askedByUserId: answer.askedByUserId || session.user.id,
        question: parsedInput.data.question,
      },
    };
  } catch (error) {
    return mapJudgeError(error);
  }
}
