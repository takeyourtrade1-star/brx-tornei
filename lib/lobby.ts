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

/** Torneo a cui l'utente è attualmente seduto (in attesa o in partita). */
export function findMyTable(tournaments: Tournament[], userId: string): Tournament | null {
  return (
    tournaments.find(
      (t) => isActive(t) && t.participants.some((p) => p.id === userId),
    ) ?? null
  );
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
 * - se sono seduto, il mio tavolo è sempre in cima ed evidenziato;
 * - i tavoli altrui con un posto libero sono "siediti";
 * - se non sono seduto da nessuna parte, c'è sempre almeno un tavolo vuoto
 *   a cui partecipare (max {@link MAX_EMPTY_TABLES}).
 */
export function buildLobbyTables(params: {
  tournaments: Tournament[];
  userId: string;
}): LobbyTable[] {
  const { tournaments, userId } = params;
  const tables: LobbyTable[] = [];

  const myTournament = findMyTable(tournaments, userId);

  if (myTournament) {
    tables.push({
      key: myTournament.id,
      kind: 'mine',
      tournament: myTournament,
      seats: toSeats(myTournament, userId),
      started: myTournament.status === 'iniziata',
    });
  }

  for (const t of tournaments) {
    if (myTournament && t.id === myTournament.id) continue;
    if (t.status !== 'in_registrazione') continue;
    if (t.participants.length >= t.maxPlayers) continue;
    if (t.participants.some((p) => p.id === userId)) continue;
    tables.push({
      key: t.id,
      kind: 'joinable',
      tournament: t,
      seats: toSeats(t, userId),
      started: false,
    });
  }

  // Se non sono seduto a nessun tavolo, garantisco sempre un tavolo vuoto.
  if (!myTournament) {
    const emptyCount = Math.min(MAX_EMPTY_TABLES, tables.length === 0 ? 1 : 1);
    for (let i = 0; i < emptyCount; i++) {
      tables.push({
        key: `__empty-${i}`,
        kind: 'empty',
        tournament: null,
        seats: EMPTY_SEATS,
        started: false,
      });
    }
  }

  return tables;
}
