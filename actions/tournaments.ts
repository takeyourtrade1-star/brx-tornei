'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  createTournament,
  addMockTournament,
  joinTournament,
  getTournamentById,
} from '@/lib/data/tournaments';
import { assertJoinDeckRequirements } from '@/lib/join-deck-gate';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { createTournamentSchema, joinTournamentSchema } from '@/lib/validations/tournament';
import type { Tournament } from '@/types/tournament';

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
        'Tessera Ebartex richiesta per creare o partecipare ai tornei. Completa l’iscrizione in Associazione.',
      TOURNAMENT_FULL: 'Il torneo è già al completo.',
      API_NOT_CONFIGURED: 'Servizio tornei non configurato.',
      API_UNAVAILABLE:
        'Il Tournament Service non è raggiungibile. Verifica NEXT_PUBLIC_TOURNAMENTS_API_URL o rimuovilo per usare il mock in locale.',
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
 * Crea un torneo per la selezione corrente.
 * Regole: sessione obbligatoria (riletta dal cookie, mai dal client),
 * input validato con zod, buy-in forzato a "For Fun" (MVP).
 */
export async function createTournamentAction(
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = createTournamentSchema.safeParse({
    format: formData.get('format'),
    mode: formData.get('mode'),
    bestOf: formData.get('bestOf') ?? 'BO3',
    isPrivate: formData.get('isPrivate'),
    isTournament: formData.get('isTournament'),
    enableScryfallCheck: formData.get('enableScryfallCheck'),
    enablePhysicalVerification: formData.get('enablePhysicalVerification'),
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
    return mapApiError(err, 'Impossibile creare il torneo');
  }
}

/**
 * Aggiunge un torneo generato dal minigioco.
 */
export async function createTournamentFromGameAction(
  t: Tournament,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  await addMockTournament(t);
  revalidatePath('/tornei');
  return {};
}

/**
 * Registra la partecipazione dell'utente corrente a un torneo.
 */
export async function joinTournamentAction(
  tournamentId: string,
  deckId?: string
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = joinTournamentSchema.safeParse({ tournamentId, deckId: deckId ?? '' });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati join non validi.' };
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: 'Torneo non trovato.' };
  }

  const gate = await assertJoinDeckRequirements(
    session.user.id,
    tournament,
    parsed.data.deckId
  );
  if (!gate.ok) {
    return { error: gate.error };
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
    return mapApiError(err, 'Impossibile partecipare al torneo');
  }
}
