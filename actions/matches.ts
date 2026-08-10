'use server';

import { getSession } from '@/lib/auth/session';
import {
  postConnectionQuality,
  postDeclareResult,
  postReportPeerAlive,
  postReportPeerLost,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import {
  connectionQualitySchema,
  type ConnectionQualityInput,
} from '@/lib/validations/connection-quality';

/**
 * Segnali locali di instabilità P2P con scadenza lato backend:
 * chiamati automaticamente dal link WebRTC (vedi use-match-peer-connection.ts),
 * non da un'azione dell'utente. Best-effort: un fallimento qui non deve mai
 * interrompere la partita in corso. Non assegnano risultati o penalità: lo
 * sweep periodico rimuove soltanto i segnali scaduti.
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

/** Campione diagnostico autenticato. È best-effort e non può assegnare esiti. */
export async function reportConnectionQualityAction(
  webcamSessionId: string,
  sample: ConnectionQualityInput,
): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const parsed = connectionQualitySchema.safeParse(sample);
  if (!parsed.success || !webcamSessionId) return;
  try {
    await postConnectionQuality(webcamSessionId, parsed.data);
  } catch {
    /* Il monitor riprova al campione successivo. */
  }
}

export interface DeclareResultActionState {
  error?: string;
  errorCode?: string;
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
    if (err instanceof TournamentApiError) {
      return { error: err.message, errorCode: err.code };
    }
    return { error: 'Impossibile dichiarare il risultato' };
  }
}
