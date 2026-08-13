'use server';

import { getSession } from '@/lib/auth/session';
import { submitMatchReport } from '@/lib/data/match-report';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { matchReportSchema } from '@/lib/validations/match-report';

export interface ReportActionState {
  error?: string;
  status?: 'ok' | 'already_submitted';
}

/**
 * Segnalazione contro l'avversario durante una partita: testo libero
 * validato con zod e inviato alla moderazione. Una segnalazione per
 * giocatore per match, garantita dal backend.
 */
export async function submitMatchReportAction(
  matchId: string,
  input: unknown,
): Promise<ReportActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }
  if (!matchId) {
    return { error: 'Partita non valida.' };
  }
  const parsed = matchReportSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Segnalazione non valida.' };
  }
  try {
    const result = await submitMatchReport(matchId, parsed.data.message);
    return { status: result.status };
  } catch (err) {
    if (err instanceof TournamentApiError) {
      return { error: err.message };
    }
    return { error: 'Impossibile inviare la segnalazione' };
  }
}
