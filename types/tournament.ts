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
  format: FormatId;
  mode: ModeId;
  buyIn: BuyIn;
  bestOf: BestOf;
  status: TournamentStatus;
  maxPlayers: number;
  participants: Participant[];
  createdAt: string;
  isPrivate?: boolean;
  /** Torneo strutturato (verifica mazzo obbligatoria). */
  isTournament?: boolean;
  enableScryfallCheck?: boolean;
  enablePhysicalVerification?: boolean;
  webcamSessionId?: string;
  matchId?: string;
  matchWebcamSessionId?: string;
  createdById?: string;
}

/** Risultato join torneo (può avviare un match). */
export interface JoinTournamentResult {
  tournament: Tournament;
  matchId?: string;
  matchWebcamSessionId?: string;
}

export type { BuyIn };
