'use server';

import { getSession } from '@/lib/auth/session';
import {
  postDeclareResult,
  postReportPeerAlive,
  postReportPeerLost,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';

/**
 * Segnali di presenza P2P per il countdown di abbandono lato backend (90s):
 * chiamati automaticamente dal link WebRTC (vedi use-match-peer-connection.ts),
 * non da un'azione dell'utente. Best-effort: un fallimento qui non deve mai
 * interrompere la partita in corso, il backend converge comunque tramite lo
 * sweep periodico (vedi CORREZIONE 1 nel piano).
 */
export async function reportPeerLostAction(webcamSessionId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
    await postReportPeerLost(webcamSessionId);
  } catch {
    /* best-effort */
  }
}

export async function reportPeerAliveAction(webcamSessionId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  try {
    await postReportPeerAlive(webcamSessionId);
  } catch {
    /* best-effort */
  }
}

export interface DeclareResultActionState {
  error?: string;
}

/**
 * "Chi ha vinto?": a differenza dei segnali di presenza qui sopra, questa è
 * un'azione esplicita del giocatore — un fallimento deve arrivare alla UI
 * (non best-effort), cosi il pannello può mostrare l'errore e permettere un
 * nuovo tentativo.
 */
export async function declareResultAction(
  matchId: string,
  winnerUserId: string,
): Promise<DeclareResultActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }
  try {
    await postDeclareResult(matchId, winnerUserId);
    return {};
  } catch (err) {
    if (err instanceof TournamentApiError) return { error: err.message };
    return { error: 'Impossibile dichiarare il risultato' };
  }
}
