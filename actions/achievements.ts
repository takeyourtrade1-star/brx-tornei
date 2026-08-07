'use server';

import { getSession } from '@/lib/auth/session';
import { fetchMyReputation, type ReputationSummary } from '@/lib/data/player-api-client';

export type AchievementsState =
  | { ok: true; reputation: ReputationSummary }
  | { ok: false; error: string };

/**
 * Reputazione per il pannello profilo / achievement. Il summary è la sorgente
 * anche dei badge: non inventiamo stato — i badge li calcoliamo lato client
 * dalla ReputationSummary (sempre la stessa shape, zero backend nuovo).
 */
export async function fetchMyAchievementsAction(): Promise<AchievementsState> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: 'Sessione scaduta: effettua di nuovo il login.' };
  }
  try {
    const reputation = await fetchMyReputation();
    // Garantiamo `history` come array (oggi recent, domani storico completo).
    return { ok: true, reputation: { ...reputation, history: reputation.history ?? [] } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile leggere la reputazione';
    return { ok: false, error: message };
  }
}
