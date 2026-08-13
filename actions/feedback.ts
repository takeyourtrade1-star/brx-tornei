'use server';

import { getSession } from '@/lib/auth/session';
import {
  submitEndFeedback,
  submitOpponentBadge,
} from '@/lib/data/match-feedback';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import {
  endFeedbackSchema,
  opponentBadgeSchema,
} from '@/lib/validations/match-feedback';

export interface FeedbackActionState {
  error?: string;
  status?: 'ok' | 'already_submitted';
}

/**
 * Rapporto di battaglia (fine per abbandono/disconnessione): conferma
 * dell'esito e qualità della connessione percepita. Una submission per
 * giocatore per match, garantita dal backend.
 */
export async function submitEndFeedbackAction(
  matchId: string,
  input: unknown,
): Promise<FeedbackActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }
  if (!matchId) {
    return { error: 'Partita non valida.' };
  }
  const parsed = endFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Dati del rapporto non validi.' };
  }
  try {
    const result = await submitEndFeedback(matchId, parsed.data);
    return { status: result.status };
  } catch (err) {
    if (err instanceof TournamentApiError) {
      return { error: err.message };
    }
    return { error: 'Impossibile inviare il rapporto di fine partita' };
  }
}

/**
 * Titolo (badge) consegnato all'avversario a partita conclusa. Stessa
 * regola di idempotenza: una consegna per giocatore per match.
 */
export async function submitOpponentBadgeAction(
  matchId: string,
  badgeId: unknown,
): Promise<FeedbackActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }
  if (!matchId) {
    return { error: 'Partita non valida.' };
  }
  const parsed = opponentBadgeSchema.safeParse({ badge: badgeId });
  if (!parsed.success) {
    return { error: 'Titolo non valido.' };
  }
  try {
    const result = await submitOpponentBadge(matchId, parsed.data.badge);
    return { status: result.status };
  } catch (err) {
    if (err instanceof TournamentApiError) {
      return { error: err.message };
    }
    return { error: 'Impossibile consegnare il titolo all’avversario' };
  }
}
