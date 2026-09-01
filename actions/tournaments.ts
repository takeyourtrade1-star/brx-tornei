'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import {
  createTournament,
  joinTournament,
  leaveTournament,
  readyTournament,
  getTournamentById,
} from '@/lib/data/tournaments';
import {
  assertDeclaredDeckRequirements,
  assertJoinDeckRequirements,
  requiresDeclaredDeckForJoin,
} from '@/lib/join-deck-gate';
import { TournamentApiError } from '@/lib/data/tournament-api-client';
import { createTableSchema, joinTournamentSchema } from '@/lib/validations/tournament';

export interface TournamentActionState {
  error?: string;
  errorCode?: string;
  createdId?: string;
  webcamSessionId?: string;
  matchId?: string;
  matchWebcamSessionId?: string;
  /** true quando il tavolo ha raggiunto il numero massimo di giocatori. */
  tableFull?: boolean;
}

function mapApiError(err: unknown, fallback: string): TournamentActionState {
  if (err instanceof TournamentApiError) {
    const messages: Record<string, string> = {
      MEMBERSHIP_REQUIRED:
        'Tessera Ebartex richiesta per giocare ai tornei. Completa l’iscrizione in Associazione.',
      TOURNAMENT_FULL: 'Il tavolo è già al completo.',
      ALREADY_SEATED:
        'Sei già seduto a un altro tavolo (anche in un altro formato): alzati o abbandona quella partita prima.',
      GAMERTAG_REQUIRED: 'Imposta un gamertag prima di giocare, dalla pagina del tuo profilo tornei.',
      API_NOT_CONFIGURED: 'Servizio tornei non configurato.',
      API_UNAVAILABLE: 'Il servizio tornei non è raggiungibile. Riprova tra poco.',
      READY_CHECK_EXPIRED: 'Il tempo per accettare la partita è scaduto.',
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
 * Il mazzo è facoltativo.
 */
export async function createTableAction(
  format: string,
  mode: string,
  deckId?: string,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = createTableSchema.safeParse({
    format,
    mode,
    bestOf: 'BO3',
    isPrivate: false,
    withFriend: true,
    isTournament: false,
    enableScryfallCheck: false,
    enablePhysicalVerification: false,
    deckId,
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Selezione non valida' };
  }

  if (parsed.data.deckId) {
    const gate = await assertDeclaredDeckRequirements(session.user.id, {
      deckId: parsed.data.deckId,
      format: parsed.data.format,
      requireScryfall: false,
    });
    if (!gate.ok) return { error: gate.error };
  }

  let createdId: string | null = null;
  try {
    const tournament = await createTournament(parsed.data, {
      id: session.user.id,
      username: session.user.name ?? session.user.email,
    });
    createdId = tournament.id;
    // Il backend storico siede il creatore durante la POST di creazione. La
    // join idempotente associa subito lo snapshot del mazzo prima di restituire
    // il tavolo al browser.
    const seated = await joinTournament(tournament.id, {
      id: session.user.id,
      username: session.user.name ?? session.user.email,
    }, parsed.data.deckId);
    revalidatePath('/tornei');
    return {
      createdId: seated.tournament.id,
      webcamSessionId: seated.tournament.webcamSessionId,
    };
  } catch (err) {
    if (createdId) await leaveTournament(createdId).catch(() => {});
    return mapApiError(err, 'Impossibile creare il tavolo');
  }
}

/**
 * Siede l'utente a un tavolo esistente. A tavolo pieno si apre il ready check:
 * il match parte solo dopo la conferma esplicita di entrambi i giocatori.
 * `deckId` è opzionale: vuoto = gioco senza associare un mazzo. Se il tavolo
 * richiede una verifica, la dichiarazione resta obbligatoria.
 */
export async function joinTournamentAction(
  tournamentId: string,
  deckId?: string,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = joinTournamentSchema.safeParse({ tournamentId, deckId });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati non validi.' };
  }

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    return { error: 'Tavolo non trovato.' };
  }

  if (!parsed.data.deckId && requiresDeclaredDeckForJoin(tournament)) {
    return { error: 'Dichiara il mazzo con cui vuoi partecipare.' };
  }

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
    }, parsed.data.deckId);
    revalidatePath('/tornei');
    revalidatePath(`/tornei/${tournamentId}/live`);
    return {
      createdId: result.tournament.id,
      matchId: result.matchId,
      matchWebcamSessionId: result.matchWebcamSessionId,
      tableFull:
        result.tournament.participants.length >= result.tournament.maxPlayers,
    };
  } catch (err) {
    return mapApiError(err, 'Impossibile sederti al tavolo');
  }
}

/**
 * Ready check: segna il giocatore pronto (o annulla). Quando entrambi sono
 * pronti il backend crea il match e la risposta contiene matchId.
 */
export async function readyTournamentAction(
  tournamentId: string,
  ready: boolean,
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  try {
    const result = await readyTournament(tournamentId, ready);
    revalidatePath('/tornei');
    revalidatePath(`/tornei/${tournamentId}/live`);
    return {
      createdId: result.tournament.id,
      matchId: result.matchId,
      matchWebcamSessionId: result.matchWebcamSessionId,
    };
  } catch (err) {
    return mapApiError(err, 'Impossibile aggiornare lo stato pronto');
  }
}

export interface ActiveMatchStatus {
  /** 'unknown' su errore API: il chiamante non deve scartare il riferimento. */
  status: 'active' | 'inactive' | 'unknown';
  opponent?: string | null;
  /** ISO: finestra di riconnessione attiva per uno dei due giocatori. */
  graceDeadline?: string | null;
}

/**
 * Verifica se l'utente sta ancora partecipando a una partita in corso:
 * usata dal banner "Torna alla partita" per validare il riferimento salvato.
 */
export async function activeMatchStatusAction(
  tournamentId: string,
): Promise<ActiveMatchStatus> {
  const session = await getSession();
  if (!session) return { status: 'inactive' };

  try {
    const tournament = await getTournamentById(tournamentId);
    if (!tournament || tournament.status !== 'iniziata') return { status: 'inactive' };
    const seated = tournament.participants.some((p) => p.id === session.user.id);
    if (!seated) return { status: 'inactive' };
    const opponent =
      tournament.participants.find((p) => p.id !== session.user.id)?.username ?? null;
    const graceDeadline = tournament.graceDeadline ?? null;
    return { status: 'active', opponent, graceDeadline };
  } catch {
    return { status: 'unknown' };
  }
}

/** Uscita volontaria: chiude il match iniziato o alza l'utente se ancora in attesa. */
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
    revalidatePath(`/tornei/${tournamentId}/live`);
    return {};
  } catch (err) {
    return mapApiError(err, 'Impossibile alzarsi dal tavolo');
  }
}
