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

export function getAvatarIdForGamertag(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % KNOWN_AVATARS.length;
  return KNOWN_AVATARS[idx] ?? 'crown';
}

export const mockFriendsStore = new Map<string, Set<string>>([
  ['default', new Set(['Alex_TCG', 'Valerio_Magic', 'Sara_Draws', 'Kurogane'])],
]);

export const mockRequestsStore = new Map<string, FriendRequestItem[]>([
  [
    'default',
    [
      {
        id: 'req-1',
        gamertag: 'DeckMaster99',
        avatarId: 'swords',
        createdAtText: 'Oggi',
        direction: 'incoming',
      },
    ],
  ],
]);

export const mockChallengesStore = new Map<string, DirectGameChallenge>();
export const mockDndStore = new Map<string, number>();

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
): PublicPlayerProfile {
  const normalized = targetGamertag.trim();
  const isSelf = Boolean(myGamertag && myGamertag.toLowerCase() === normalized.toLowerCase());
  const friends = mockFriendsStore.get('default') ?? new Set();
  const isFriend = friends.has(normalized);

  const hash = Array.from(normalized).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const played = isSelf ? 0 : 5 + (hash % 10);
  const wins = Math.floor(played * 0.5);
  const losses = played - wins;
  const winStreak = 0;
  const dailyWins = 0;

  const dnd = isPlayerDnd(normalized);
  const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
  const presence = dnd ? 'dnd' : isSelf ? 'online' : presenceList[hash % presenceList.length];

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
    // Solo le medaglie d'onore effettivamente ricevute (default 0 per evitare numeri gonfiati)
    honorBadges: {
      friendly: 0,
      sportive: 0,
      great_player: 0,
      strategist: 0,
      punctual: 0,
    },
    friendship: isSelf ? 'self' : isFriend ? 'friend' : 'none',
  };
}
