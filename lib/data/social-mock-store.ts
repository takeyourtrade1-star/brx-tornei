import type {
  DirectGameChallenge,
  FriendPresenceStatus,
  FriendRequestItem,
  FriendSummary,
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

/** Mappa la presenza preservando la privacy: zero timestamp precisi */
export function mapPresence(lastSeenMinutesAgo?: number, inGame?: boolean): FriendPresenceStatus {
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
  const played = 15 + (hash % 60);
  const wins = Math.floor(played * (0.45 + (hash % 30) / 100));
  const losses = played - wins;
  const winStreak = hash % 5;
  const dailyWins = Math.min(5, hash % 4);

  const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
  const presence = isSelf ? 'online' : presenceList[hash % presenceList.length];

  return {
    gamertag: normalized,
    avatarId: getAvatarIdForGamertag(normalized),
    presence,
    stats: {
      played,
      wins,
      losses,
      abandoned: hash % 3 === 0 ? 1 : 0,
      disputed: 0,
      winStreak,
      dailyWins,
    },
    unlockedAchievements: ['first-win', 'ten-games', wins >= 10 ? 'ten-wins' : 'first-loss'],
    honorBadges: {
      friendly: 4 + (hash % 12),
      sportive: 2 + (hash % 8),
      great_player: 1 + (hash % 6),
      strategist: hash % 5,
      punctual: 3 + (hash % 7),
    },
    friendship: isSelf ? 'self' : isFriend ? 'friend' : 'none',
  };
}
