import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { BuyIn } from '@/lib/data/buy-in';
import type { DeckCard } from '@/types/deck';

/** "Forma" dal mockup: best-of (2/3 = BO3, 3/5 = BO5). */
export type BestOf = 'BO1' | 'BO3' | 'BO5';

export type TournamentStatus = 'in_registrazione' | 'iniziata' | 'terminata';

/** Mazzo dichiarato/verificato dal giocatore per la partita (se disponibile). */
export interface ParticipantDeck {
  id?: string;
  name: string;
  /** Archetipo/tipologia (es. "Aggro"), se noto. */
  archetype?: string;
  /** Stato verifica del mazzo per questa partita. */
  verified?: boolean;
  /** Snapshot delle carte usate; esposto ai due giocatori solo a partita finita. */
  main?: DeckCard[];
  side?: DeckCard[];
}

export type ConnectionQualityLevel = 'good' | 'fair' | 'poor';
export type ConnectionTransport = 'server' | 'direct' | 'relay' | 'unknown';

export interface ConnectionQuality {
  level: ConnectionQualityLevel;
  rttMs?: number;
  packetLossPct?: number;
  jitterMs?: number;
  transport: ConnectionTransport;
  checkedAt?: string;
  poorSamples?: number;
  lastPoorAt?: string;
}

export interface Participant {
  id: string;
  username: string;
  /** Ready check: true quando il giocatore ha premuto "Pronto". */
  ready?: boolean;
  /** Ultimo controllo diagnostico; non determina mai l'esito della partita. */
  connection?: ConnectionQuality;
  /** Mazzo usato in partita — popolato dal backend quando disponibile. */
  deck?: ParticipantDeck;
}

export type MatchJudgeStatus = 'idle' | 'processing' | 'failed';
export type MatchJudgeTurnStatus = 'processing' | 'completed' | 'failed';
export type MatchJudgeKind = 'ruling' | 'clarification';

/** Risposta strutturata del Judge, già filtrata dal Tournament Service. */
export interface MatchJudgeTurn {
  id: string;
  sequence: number;
  askedByUserId: string;
  question: string;
  status: MatchJudgeTurnStatus;
  reply?: string;
  kind?: MatchJudgeKind;
  verdict?: string;
  steps?: string[];
  ruleRefs?: string[];
  rulesVersion?: string;
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
}

export interface MatchJudgeState {
  status: MatchJudgeStatus;
  turns: MatchJudgeTurn[];
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
  /** Ultima attività autorevole registrata dal Tournament Service. */
  updatedAt: string;
  /** Ora del Tournament Service associata a questo snapshot. */
  serverTime?: string;
  /** Deadline condivisa del modale Accetta partita. */
  readyDeadline?: string;
  /** Istante condiviso in cui termina il countdown di avvio. */
  startsAt?: string;
  isPrivate?: boolean;
  /** true: P2P diretto consentito; l'IP pubblico pu\u00f2 essere visibile al peer. */
  withFriend?: boolean;
  /** Torneo strutturato (verifica mazzo obbligatoria). */
  isTournament?: boolean;
  enableScryfallCheck?: boolean;
  enablePhysicalVerification?: boolean;
  webcamSessionId?: string;
  matchId?: string;
  matchWebcamSessionId?: string;
  /** Ruolo signaling assegnato dal backend per il match corrente. */
  signalingRole?: 'host' | 'guest';
  createdById?: string;
  /** Stato del match corrente lato backend. */
  matchStatus?: 'ongoing' | 'finished';
  /** Causa di chiusura: forfeit volontario, cleanup neutro, dichiarazione concorde. */
  endReason?: 'leave' | 'timeout' | 'reported' | 'disputed';
  winnerUserId?: string;
  /** Punteggio game per giocatore, concordato insieme al vincitore. */
  scoreByPlayerId?: Record<string, number>;
  /** Solo per il viewer: il suo client ha registrato una perdita del peer P2P. */
  disconnectedUserId?: string;
  /** ISO: istante oltre il quale il segnale P2P locale viene rimosso. */
  graceDeadline?: string;
  resultStatus?: 'claimed' | 'settled';
  resultClaimDeadline?: string;
  /** Chi ha dichiarato per primo un risultato ("Chi ha vinto?", Requisito 2). */
  resultClaimedBy?: string;
  /** Chi la prima dichiarazione indica come vincitore. */
  resultClaimedWinner?: string;
  /** 1 = prima scelta; 2 = seconda scelta richiesta dopo un disaccordo. */
  resultRound?: number;
  resultReselectionRequired?: boolean;
  /** Judge opzionale della partita, visibile ai giocatori autorizzati. */
  judge?: MatchJudgeState;
}

/** Risultato join torneo (può avviare un match). */
export interface JoinTournamentResult {
  tournament: Tournament;
  matchId?: string;
  matchWebcamSessionId?: string;
}

export type { BuyIn };
