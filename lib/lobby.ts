import type { ConnectionQuality, Tournament } from '@/types/tournament';
import type { FormatFilter } from '@/lib/validations/selection';

/** Un posto al tavolo: libero oppure occupato da un giocatore. */
export type Seat =
  | { occupied: false }
  | {
      occupied: true;
      id: string;
      username: string;
      isMe: boolean;
      connection?: ConnectionQuality;
    };

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
    return {
      occupied: true,
      id: p.id,
      username: p.username,
      isMe: p.id === userId,
      connection: p.connection,
    };
  };
  // Metto sempre prima il posto dell'utente se presente, così la card è "dalla sua prospettiva".
  const seats: [Seat, Seat] = [seatFor(0), seatFor(1)];
  return seats;
}

const EMPTY_SEATS: [Seat, Seat] = [{ occupied: false }, { occupied: false }];

/**
 * Costruisce l'elenco di tavoli mostrato in lobby, secondo le regole:
 * - se sono seduto, il mio tavolo resta in cima ma vedo anche le altre sfide
 *   disponibili; non compare però un secondo invito alla creazione;
 * - in cima c'è sempre il singolo invito "Apri nuovo tavolo": se esiste già
 *   un tavolo vuoto lo riutilizzo, altrimenti è sintetico e ne crea uno nuovo;
 * - i tavoli altrui con un giocatore in attesa sono "siediti";
 * - i MIEI tavoli compaiono sempre, anche se appartengono a un altro formato:
 *   altrimenti un tavolo rimasto aperto altrove sarebbe invisibile ma il
 *   backend rifiuterebbe di sedersi altrove con ALREADY_SEATED.
 */
export function buildLobbyTables(params: {
  tournaments: Tournament[];
  userId: string;
  /** Formato selezionato: filtra i tavoli altrui, mai i miei. */
  format?: FormatFilter;
}): LobbyTable[] {
  const { tournaments, userId, format = 'all' } = params;

  const matchesFormat = (t: Tournament): boolean => format === 'all' || t.format === format;
  const myTournaments = findMyTables(tournaments, userId);

  const available = tournaments
    .filter(
      (t) =>
        matchesFormat(t) &&
        t.withFriend === true &&
        t.status === 'in_registrazione' &&
        t.participants.length > 0 &&
        t.participants.length < t.maxPlayers &&
        !t.participants.some((participant) => participant.id === userId),
    )
    .map((t): LobbyTable => ({
      key: t.id,
      kind: 'joinable',
      tournament: t,
      seats: toSeats(t, userId),
      started: false,
    }));

  if (myTournaments.length > 0) {
    const mine = myTournaments.map((t): LobbyTable => ({
      key: t.id,
      kind: 'mine',
      tournament: t,
      seats: toSeats(t, userId),
      started: t.status === 'iniziata',
    }));
    return [...mine, ...available];
  }

  const joinable: LobbyTable[] = [];
  const emptyExisting: LobbyTable[] = [];

  for (const t of tournaments) {
    if (!matchesFormat(t)) continue;
    if (t.withFriend !== true) continue;
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

  // Sempre un unico tasto "Apri nuovo tavolo" in cima: se esiste un vuoto reale
  // lo riutilizzo (host ci si siede), altrimenti sintetico che ne crea uno nuovo.
  const primaryEmpty: LobbyTable =
    emptyExisting[0] ??
    { key: '__empty-0', kind: 'empty', tournament: null, seats: EMPTY_SEATS, started: false };

  return [primaryEmpty, ...joinable];
}
