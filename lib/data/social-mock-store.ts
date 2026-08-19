import type {
  DirectGameChallenge,
  FriendPresenceStatus,
  FriendRequestItem,
  PublicPlayerProfile,
} from '@/types/social';

const KNOWN_AVATARS = [
  'crown',
  'swords',
  'flame',
  'skull',
  'zap',
  'shield',
  'ghost',
  'sparkles',
  'gamepad',
  'trophy',
];

export const MOCK_BOT_TAGS = new Set([
  'alex_tcg',
  'valerio_magic',
  'sara_draws',
  'kurogane',
  'deckmaster99',
  'blacklotus_fan',
  'chandra_flame',
  'jace_mind',
  'liliana_dread',
]);

export const KNOWN_EBARTEX_USERNAMES = new Map<string, string>([
  ['drakone_rabioso', 'Clemyx'],
  ['king', 'King_Ebartex'],
  ['alex_tcg', 'alex_cards'],
  ['valerio_magic', 'valerio_tcg'],
  ['sara_draws', 'sara_art'],
  ['kurogane', 'kurogane_store'],
  ['deckmaster99', 'deckmaster'],
  ['blacklotus_fan', 'blacklotus_dealer'],
]);

export function isMockBot(gamertag: string): boolean {
  return MOCK_BOT_TAGS.has(gamertag.trim().toLowerCase());
}

export function getAvatarIdForGamertag(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % KNOWN_AVATARS.length;
  return KNOWN_AVATARS[idx] ?? 'crown';
}

export interface RawMockFriendRequest {
  id: string;
  senderGamertag: string;
  recipientGamertag: string;
  createdAt: number;
}

/** Amicizie per utente: Map<gamertagLower, Set<friendGamertag>> */
export const mockFriendsStore = new Map<string, Set<string>>();

/** Richieste di amicizia globali tra coppie di utenti */
export const mockRawRequests: RawMockFriendRequest[] = [];

export const mockChallengesStore = new Map<string, DirectGameChallenge>();
export const mockDndStore = new Map<string, number>();
export const mockEbartexVisibilityStore = new Map<string, boolean>();

export function isPlayerDnd(gamertag: string): boolean {
  const expiresAt = mockDndStore.get(gamertag.toLowerCase());
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    mockDndStore.delete(gamertag.toLowerCase());
    return false;
  }
  return true;
}

export function setPlayerDnd(gamertag: string, durationMinutes = 60): void {
  mockDndStore.set(gamertag.toLowerCase(), Date.now() + durationMinutes * 60 * 1000);
}

export function isEbartexProfileVisible(gamertag: string): boolean {
  const pref = mockEbartexVisibilityStore.get(gamertag.toLowerCase());
  return pref !== false;
}

export function setEbartexProfileVisible(gamertag: string, visible: boolean): void {
  mockEbartexVisibilityStore.set(gamertag.toLowerCase(), visible);
}

/** Mappa la presenza preservando la privacy: zero timestamp precisi */
export function mapPresence(
  lastSeenMinutesAgo?: number,
  inGame?: boolean,
  isDnd?: boolean,
): FriendPresenceStatus {
  if (isDnd) return 'dnd';
  if (inGame) return 'in_game';
  if (typeof lastSeenMinutesAgo !== 'number' || lastSeenMinutesAgo <= 5) return 'online';
  if (lastSeenMinutesAgo <= 48 * 60) return 'recent';
  return 'offline';
}

export function buildFallbackPublicProfile(
  targetGamertag: string,
  myGamertag?: string | null,
  myEbartexUsername?: string | null,
): PublicPlayerProfile {
  const normalized = targetGamertag.trim();
  const isSelf = Boolean(myGamertag && myGamertag.toLowerCase() === normalized.toLowerCase());
  
  let isFriend = false;
  let isPendingSent = false;
  let isPendingReceived = false;

  if (myGamertag) {
    const myFriends = mockFriendsStore.get(myGamertag.toLowerCase()) ?? new Set();
    isFriend = myFriends.has(normalized);

    const pending = mockRawRequests.find(
      (r) =>
        (r.senderGamertag.toLowerCase() === myGamertag.toLowerCase() &&
          r.recipientGamertag.toLowerCase() === normalized.toLowerCase()) ||
        (r.senderGamertag.toLowerCase() === normalized.toLowerCase() &&
          r.recipientGamertag.toLowerCase() === myGamertag.toLowerCase()),
    );
    if (pending) {
      if (pending.senderGamertag.toLowerCase() === myGamertag.toLowerCase()) {
        isPendingSent = true;
      } else {
        isPendingReceived = true;
      }
    }
  }

  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const played = isSelf ? 0 : 5 + (hash % 10);
  const wins = Math.floor(played * 0.5);
  const losses = played - wins;
  const winStreak = 0;
  const dailyWins = 0;

  const dnd = isPlayerDnd(normalized);
  const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
  const presence = dnd ? 'dnd' : isSelf ? 'online' : presenceList[hash % presenceList.length];
  const showEbartex = isEbartexProfileVisible(normalized);

  const friendship = isSelf
    ? 'self'
    : isFriend
      ? 'friend'
      : isPendingSent
        ? 'pending_sent'
        : isPendingReceived
          ? 'pending_received'
          : 'none';

  return {
    gamertag: normalized,
    avatarId: getAvatarIdForGamertag(normalized),
    presence,
    stats: {
      played,
      wins,
      losses,
      abandoned: 0,
      disputed: 0,
      winStreak,
      dailyWins,
    },
    unlockedAchievements: wins > 0 ? ['first-win'] : [],
    honorBadges: {
      friendly: 0,
      sportive: 0,
      great_player: 0,
      strategist: 0,
      punctual: 0,
    },
    friendship,
    isBot: isMockBot(normalized),
    showEbartexProfile: showEbartex,
    ebartexUsername: isSelf
      ? (myEbartexUsername ?? KNOWN_EBARTEX_USERNAMES.get(normalized.toLowerCase()) ?? normalized)
      : showEbartex
        ? (KNOWN_EBARTEX_USERNAMES.get(normalized.toLowerCase()) ?? normalized)
        : null,
  };
}
