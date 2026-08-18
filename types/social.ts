/**
 * Tipi condivisi per il sistema social, profili pubblici, presenza e sfide.
 */

export type FriendPresenceStatus = 'online' | 'in_game' | 'recent' | 'offline';

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
}

export interface FriendSummary {
  gamertag: string;
  avatarId: string;
  presence: FriendPresenceStatus;
  statusText?: string;
  winStreak: number;
  dailyWins: number;
}

export interface FriendRequestItem {
  id: string;
  gamertag: string;
  avatarId: string;
  /** "Oggi", "Ieri", "Recente" — mai timestamp precisi per tutela privacy */
  createdAtText: string;
  direction: 'incoming' | 'outgoing';
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
}
