/**
 * Traccia in localStorage la partita in corso del giocatore: la vista live la
 * salva quando il match è attivo e la pulisce a fine partita/abbandono, così
 * il banner "Torna alla partita" può riportare dentro chi è uscito per sbaglio.
 */

const KEY = 'brx:active-match';

export interface ActiveMatchRecord {
  tournamentId: string;
  opponent?: string | null;
  savedAt: number;
}

export function saveActiveMatch(record: Omit<ActiveMatchRecord, 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...record, savedAt: Date.now() }));
  } catch {
    /* storage pieno o negato: il banner semplicemente non apparirà */
  }
}

export function readActiveMatch(): ActiveMatchRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveMatchRecord>;
    if (typeof parsed.tournamentId !== 'string' || !parsed.tournamentId) return null;
    return {
      tournamentId: parsed.tournamentId,
      opponent: typeof parsed.opponent === 'string' ? parsed.opponent : null,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

/** Pulisce il record; con `tournamentId` solo se punta a quella partita. */
export function clearActiveMatch(tournamentId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (tournamentId) {
      const current = readActiveMatch();
      if (current && current.tournamentId !== tournamentId) return;
    }
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignorato */
  }
}
