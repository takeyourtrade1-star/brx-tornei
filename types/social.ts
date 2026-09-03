/**
 * Tipi condivisi per il sistema social, profili pubblici, presenza e sfide.
 */

export interface SocialActionState<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SocialPreferencesData {
  dndUntil: number | null;
  showEbartexProfile: boolean;
}

export type FriendPresenceStatus = 'online' | 'in_game' | 'dnd' | 'recent' | 'offline';

export type FriendshipRelation = 'friend' | 'pending_sent' | 'pending_received' | 'none' | 'self';

export interface PublicPlayerStats {
  played: number;
  wins: number;
  losses: number;
  abandoned: number;
  disputed: number;
  winStreak: number;
  dailyWins: number;
}

export interface PublicPlayerProfile {
  gamertag: string;
  avatarId: string;
  presence: FriendPresenceStatus;
  stats: PublicPlayerStats;
  unlockedAchievements: string[];
  honorBadges: {
    friendly: number;
    sportive: number;
    great_player: number;
    strategist: number;
    punctual: number;
  };
  friendship: FriendshipRelation;
  dndUntil?: number;
  isBot?: boolean;
  /** Nome utente reale dell'account sul marketplace Ebartex (se visibile) */
  ebartexUsername?: string | null;
  /** Permesso di visibilità del profilo Ebartex agli altri utenti */
  showEbartexProfile?: boolean;
}

export interface FriendSummary {
  gamertag: string;
  avatarId: string;
  presence: FriendPresenceStatus;
  statusText?: string;
  winStreak: number;
  dailyWins: number;
  dndUntil?: number;
  isBot?: boolean;
  ebartexUsername?: string | null;
}

/** Dati minimi serializzabili verso la Sala Piazza per il rendering degli avatar. */
export type SocialRoomFriendPresence = Pick<FriendSummary, 'gamertag' | 'avatarId' | 'presence'>;

/** Duellante recente dalla reputazione, per l'aggiunta rapida in tab Amici. */
export interface RecentOpponent {
  gamertag: string;
  lastOutcome: 'win' | 'loss' | 'abandoned' | 'disputed';
  /** "Oggi", "Ieri", "Recente" — niente timestamp precisi. */
  lastPlayedText: string;
  matches: number;
}

export interface FriendRequestItem {
  id: string;
  gamertag: string;
  avatarId: string;
  /** "Oggi", "Ieri", "Recente" — mai timestamp precisi per tutela privacy */
  createdAtText: string;
  direction: 'incoming' | 'outgoing';
  isBot?: boolean;
}

export interface DirectGameChallenge {
  id: string;
  challengerGamertag: string;
  challengerAvatarId: string;
  recipientGamertag: string;
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
  tableId?: string;
  expiresAt: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  isBot?: boolean;
}
