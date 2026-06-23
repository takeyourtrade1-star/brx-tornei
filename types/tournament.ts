import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { BuyIn } from '@/lib/data/buy-in';

/** "Forma" dal mockup: best-of (2/3 = BO3, 3/5 = BO5). */
export type BestOf = 'BO1' | 'BO3' | 'BO5';

export type TournamentStatus = 'in_registrazione' | 'iniziata' | 'terminata';

export interface Participant {
  id: string;
  username: string;
}

export interface Tournament {
  id: string;
  /** Formato di gioco selezionato (Old School, Modern, Commander...). */
  format: FormatId;
  mode: ModeId;
  /** Quota di ingresso (stile buy-in poker). */
  buyIn: BuyIn;
  bestOf: BestOf;
  status: TournamentStatus;
  /** Posti totali (Heads-Up = 2). */
  maxPlayers: number;
  participants: Participant[];
  createdAt: string; // ISO
  isPrivate?: boolean; // Partita privata con lucchetto
}

export type { BuyIn };
