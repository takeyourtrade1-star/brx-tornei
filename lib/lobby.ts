import type { Tournament } from '@/types/tournament';

/** Un posto al tavolo: libero oppure occupato da un giocatore. */
export type Seat =
  | { occupied: false }
  | { occupied: true; id: string; username: string; isMe: boolean };

export type TableKind = 'mine' | 'joinable' | 'empty';

export interface LobbyTable {
  /** Chiave stabile per React (id torneo o slot sintetico). */
  key: string;
  kind: TableKind;
  /** Torneo reale dietro il tavolo; null per un tavolo vuoto sintetico. */
  tournament: Tournament | null;
  seats: [Seat, Seat];
  /** true se al tavolo è già iniziato il match (entrambi seduti). */
  started: boolean;
}

/** Massimo numero di tavoli vuoti mostrati contemporaneamente. */
export const MAX_EMPTY_TABLES = 2;

function isActive(t: Tournament): boolean {
  return t.status === 'in_registrazione' || t.status === 'iniziata';
}

/**
 * Tornei a cui l'utente è attualmente seduto (in attesa o in partita).
 * Possono essere più di uno (es. partite rimaste appese): vanno mostrati
 * tutti, così l'utente può abbandonare quelli morti.
 */
export function findMyTables(tournaments: Tournament[], userId: string): Tournament[] {
  return tournaments.filter(
    (t) => isActive(t) && t.participants.some((p) => p.id === userId),
  );
}

/** Primo torneo a cui l'utente è seduto (compat). */
export function findMyTable(tournaments: Tournament[], userId: string): Tournament | null {
  return findMyTables(tournaments, userId)[0] ?? null;
}

function toSeats(t: Tournament, userId: string): [Seat, Seat] {
  const seatFor = (index: number): Seat => {
    const p = t.participants[index];
    if (!p) return { occupied: false };
    return { occupied: true, id: p.id, username: p.username, isMe: p.id === userId };
  };
  return [seatFor(0), seatFor(1)];
}

const EMPTY_SEATS: [Seat, Seat] = [{ occupied: false }, { occupied: false }];

/**
 * Costruisce l'elenco di tavoli mostrato in lobby, secondo le regole:
 * - se sono seduto, mostro SOLO il mio tavolo (niente vuoti da cui creare
 *   doppioni finché non mi alzo);
 * - i tavoli altrui con un giocatore in attesa sono "siediti";
 * - i tavoli esistenti ma vuoti (0 giocatori, orfani lasciati da qualcuno) NON
 *   si moltiplicano: valgono come tavoli vuoti riutilizzabili, mostrati al
 *   massimo in {@link MAX_EMPTY_TABLES};
 * - se non c'è nessun tavolo vuoto disponibile, ne mostro uno sintetico da creare.
 */
export function buildLobbyTables(params: {
  tournaments: Tournament[];
  userId: string;
}): LobbyTable[] {
  const { tournaments, userId } = params;

  const myTournaments = findMyTables(tournaments, userId);

  // Sono già seduto: mostro solo i miei tavoli (tutti, se per errore sono
  // finito in più partite: da ognuno posso alzarmi/abbandonare). Impedisce di
  // creare altri tavoli mentre sono in attesa (causa dei tavoli-fantasma).
  if (myTournaments.length > 0) {
    return myTournaments.map((t) => ({
      key: t.id,
      kind: 'mine' as const,
      tournament: t,
      seats: toSeats(t, userId),
      started: t.status === 'iniziata',
    }));
  }

  const joinable: LobbyTable[] = [];
  const emptyExisting: LobbyTable[] = [];

  for (const t of tournaments) {
    if (t.status !== 'in_registrazione') continue;
    if (t.participants.length >= t.maxPlayers) continue;
    // Un mio eventuale doppione (seduto ma non rilevato come "mine"): lo salto.
    if (t.participants.some((p) => p.id === userId)) continue;

    if (t.participants.length === 0) {
      // Tavolo reale ma vuoto: riutilizzabile, non se ne crea uno nuovo.
      emptyExisting.push({
        key: t.id,
        kind: 'empty',
        tournament: t,
        seats: EMPTY_SEATS,
        started: false,
      });
    } else {
      joinable.push({
        key: t.id,
        kind: 'joinable',
        tournament: t,
        seats: toSeats(t, userId),
        started: false,
      });
    }
  }

  // Tavoli vuoti: riuso quelli esistenti (max MAX_EMPTY_TABLES); se non ce ne
  // sono, ne offro uno sintetico da creare.
  let empties = emptyExisting.slice(0, MAX_EMPTY_TABLES);
  if (empties.length === 0) {
    empties = [
      { key: '__empty-0', kind: 'empty', tournament: null, seats: EMPTY_SEATS, started: false },
    ];
  }

  return [...joinable, ...empties];
}
