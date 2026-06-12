import type { FormatId } from '@/lib/data/catalog';
import type { BestOf } from '@/types/tournament';

export type MatchStatus = 'attiva' | 'completata' | 'in_attesa';

export type MatchResult = 'vittoria' | 'sconfitta' | 'pareggio';

/** Fase calcolata server-side per partite con status attiva. */
export type ActiveMatchPhase = 'in_corso' | 'programmata';

export interface Match {
  id: string;
  userId: string;
  tournamentId: string;
  /** Etichetta leggibile del torneo (es. "Modern · Heads-Up BO3"). */
  tournamentLabel: string;
  format: FormatId;
  opponent: string;
  deckName: string;
  status: MatchStatus;
  result?: MatchResult;
  /** Punteggio games vinti (es. "2-1"). */
  score?: string;
  bestOf: BestOf;
  /** Inizio previsto o effettivo (ISO). */
  startsAt: string;
  /** Fine stimata (ISO), calcolata con durata demo. */
  endsAt: string;
  /** Solo per status attiva: in_corso se già avviata, programmata se futura. */
  activePhase?: ActiveMatchPhase;
}

export interface ActiveMatchesGrouped {
  inCorso: Match[];
  programmate: Match[];
}

export type MatchPlayerSide = 'self' | 'opponent';

export type MatchEventType =
  | 'partita_iniziata'
  | 'punto_segnato'
  | 'game_vinto'
  | 'partita_finita'
  | 'chiamata_giudice';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  timestamp: string;
  description: string;
  player?: MatchPlayerSide;
}

export type JudgeCallStatus = 'in_attesa' | 'risolta' | 'annullata';

export interface JudgeCall {
  id: string;
  timestamp: string;
  reason: string;
  status: JudgeCallStatus;
  resolvedAt?: string;
}

export interface MatchGameResult {
  gameNumber: number;
  winner: MatchPlayerSide;
  selfPoints: number;
  opponentPoints: number;
}

/** Stato punteggio live (games + punti nel game corrente). */
export interface MatchScoreState {
  selfGames: number;
  opponentGames: number;
  currentGameSelfPoints: number;
  currentGameOpponentPoints: number;
  gamesHistory: MatchGameResult[];
  isFinished: boolean;
  winner?: MatchPlayerSide;
}

/** Dettaglio partita per tavolo e gestione match. */
export interface MatchDetail extends Match {
  scoreState: MatchScoreState;
  events: MatchEvent[];
  judgeCalls: JudgeCall[];
}
