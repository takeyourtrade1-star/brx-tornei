'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  finishMatch,
  getMatchById,
  recordGameWin,
  recordMatchPoint,
} from '@/lib/data/match-detail';
import type { MatchDetail, MatchPlayerSide } from '@/types/match';
import { z } from 'zod';

export interface MatchActionState {
  error?: string;
  detail?: MatchDetail;
}

const matchIdSchema = z.object({
  matchId: z.string().min(1, 'Partita non valida'),
});

const playerSchema = matchIdSchema.extend({
  player: z.enum(['self', 'opponent']),
});

function revalidateMatchPaths(matchId: string) {
  revalidatePath('/partite');
  revalidatePath(`/partite/${matchId}/tavolo`);
  revalidatePath(`/partite/${matchId}/gestione`);
}

/** Segna un punto nel game corrente (mock). */
export async function recordPointAction(
  matchId: string,
  player: MatchPlayerSide
): Promise<MatchActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta: effettua di nuovo il login.' };

  const parsed = playerSchema.safeParse({ matchId, player });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dati non validi.' };
  }

  const result = await recordMatchPoint(session.user.id, parsed.data.matchId, parsed.data.player);
  if (result.error) return { error: result.error };
  if (!result.detail) return { error: 'Partita non trovata.' };

  revalidateMatchPaths(parsed.data.matchId);
  return { detail: result.detail };
}

/** Segna vittoria del game corrente (mock). */
export async function recordGameWinAction(
  matchId: string,
  winner: MatchPlayerSide
): Promise<MatchActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta: effettua di nuovo il login.' };

  const parsed = playerSchema.safeParse({ matchId, player: winner });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dati non validi.' };
  }

  const result = await recordGameWin(session.user.id, parsed.data.matchId, parsed.data.player);
  if (result.error) return { error: result.error };
  if (!result.detail) return { error: 'Partita non trovata.' };

  revalidateMatchPaths(parsed.data.matchId);
  return { detail: result.detail };
}

/** Chiude la partita manualmente (mock). */
export async function finishMatchAction(
  matchId: string,
  winner: MatchPlayerSide
): Promise<MatchActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta: effettua di nuovo il login.' };

  const parsed = playerSchema.safeParse({ matchId, player: winner });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dati non validi.' };
  }

  const result = await finishMatch(session.user.id, parsed.data.matchId, parsed.data.player);
  if (result.error) return { error: result.error };
  if (!result.detail) return { error: 'Partita non trovata.' };

  revalidateMatchPaths(parsed.data.matchId);
  return { detail: result.detail };
}

/** Placeholder per chiamata giudice — backend non ancora disponibile. */
export async function requestJudgeCallAction(matchId: string): Promise<MatchActionState> {
  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta: effettua di nuovo il login.' };

  const parsed = matchIdSchema.safeParse({ matchId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Partita non valida.' };
  }

  const detail = await getMatchById(session.user.id, parsed.data.matchId);
  if (!detail) return { error: 'Partita non trovata.' };

  return { error: 'Chiamata al giudice — presto in arrivo.' };
}
