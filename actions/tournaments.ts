'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  createTournament,
  joinTournament,
  leaveTournament,
  getTournamentById,
} from '@/lib/data/tournaments';
import { assertJoinDeckRequirements } from '@/lib/join-deck-gate';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { createTournamentSchema, joinTournamentSchema } from '@/lib/validations/tournament';

export interface TournamentActionState {
  error?: string;
  errorCode?: string;
  createdId?: string;
  webcamSessionId?: string;
  matchId?: string;
  matchWebcamSessionId?: string;
}

function mapApiError(err: unknown, fallback: string): TournamentActionState {
  if (err instanceof TournamentApiError) {
    const messages: Record<string, string> = {
      MEMBERSHIP_REQUIRED:
        'Tessera Ebartex richiesta per giocare ai tornei. Completa l’iscrizione in Associazione.',
      TOURNAMENT_FULL: 'Il tavolo è già al completo.',
      API_NOT_CONFIGURED: 'Servizio tornei non configurato.',
      API_UNAVAILABLE: 'Il servizio tornei non è raggiungibile. Riprova tra poco.',
    };
    return {
      error: (err.code && messages[err.code]) || err.message || fallback,
      errorCode: err.code,
    };
  }
  if (err instanceof Error) return { error: err.message };
  return { error: fallback };
}

/**
 * Crea un nuovo tavolo (torneo 1v1) per il formato/modalità correnti e vi
 * siede l'utente come primo giocatore. Best of 3 fisso, pubblico, casual.
 */
export async function createTableAction(
  format: string,
  mode: string,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = createTournamentSchema.safeParse({
    format,
    mode,
    bestOf: 'BO3',
    isPrivate: false,
    withFriend: false,
    isTournament: false,
    enableScryfallCheck: false,
    enablePhysicalVerification: false,
  });
  if (!parsed.success) {
    return { error: 'Selezione non valida' };
  }

  try {
    const tournament = await createTournament(parsed.data, {
      id: session.user.id,
      username: session.user.name ?? session.user.email,
    });
    revalidatePath('/tornei');
    return {
      createdId: tournament.id,
      webcamSessionId: tournament.webcamSessionId,
    };
  } catch (err) {
    return mapApiError(err, 'Impossibile creare il tavolo');
  }
}

/**
 * Siede l'utente a un tavolo esistente. Se il tavolo si riempie parte il match.
 * `deckId` opzionale: vuoto = "Ignora deck" (nessuna verifica).
 */
export async function joinTournamentAction(
  tournamentId: string,
  deckId?: string,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = joinTournamentSchema.safeParse({ tournamentId, deckId: deckId ?? '' });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: 'Tavolo non trovato.' };
  }

  // Deck facoltativo: la verifica scatta solo se l'utente ha scelto un mazzo.
  if (parsed.data.deckId) {
    const gate = await assertJoinDeckRequirements(
      session.user.id,
      tournament,
      parsed.data.deckId,
    );
    if (!gate.ok) {
      return { error: gate.error };
    }
  }

  try {
    const result = await joinTournament(tournamentId, {
      id: session.user.id,
      username: session.user.name ?? session.user.email,
    });
    revalidatePath('/tornei');
    revalidatePath(`/tornei/${tournamentId}/live`);
    return {
      createdId: result.tournament.id,
      matchId: result.matchId,
      matchWebcamSessionId: result.matchWebcamSessionId,
    };
  } catch (err) {
    return mapApiError(err, 'Impossibile sederti al tavolo');
  }
}

/** Alza l'utente dal tavolo (lascia il torneo se ancora in attesa). */
export async function leaveTournamentAction(
  tournamentId: string,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  try {
    await leaveTournament(tournamentId);
    revalidatePath('/tornei');
    return {};
  } catch (err) {
    return mapApiError(err, 'Impossibile alzarsi dal tavolo');
  }
}
