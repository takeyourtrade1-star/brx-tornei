import type {
  FriendPresenceStatus,
  FriendRequestItem,
  FriendshipRelation,
  FriendSummary,
  PublicPlayerProfile,
  PublicPlayerStats,
} from '@/types/social';

const PRESENCE_VALUES: readonly FriendPresenceStatus[] = [
  'online',
  'in_game',
  'dnd',
  'recent',
  'offline',
];
const RELATION_VALUES: readonly FriendshipRelation[] = [
  'friend',
  'pending_sent',
  'pending_received',
  'none',
  'self',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

function pickBoolean(obj: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

function pickEnum<T extends string>(
  obj: Record<string, unknown>,
  valid: readonly T[],
  fallback: T,
  ...keys: string[]
): T {
  const value = pickString(obj, ...keys);
  return value && (valid as readonly string[]).includes(value) ? (value as T) : fallback;
}

function mapStats(raw: unknown): PublicPlayerStats {
  const obj = asRecord(raw) ?? {};
  return {
    played: pickNumber(obj, 'played') ?? 0,
    wins: pickNumber(obj, 'wins') ?? 0,
    losses: pickNumber(obj, 'losses') ?? 0,
    abandoned: pickNumber(obj, 'abandoned') ?? 0,
    disputed: pickNumber(obj, 'disputed') ?? 0,
    winStreak: pickNumber(obj, 'win_streak', 'winStreak') ?? 0,
    dailyWins: pickNumber(obj, 'daily_wins', 'dailyWins') ?? 0,
  };
}

export function mapFriendSummary(raw: unknown): FriendSummary | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const gamertag = pickString(obj, 'gamertag');
  if (!gamertag) return null;
  return {
    gamertag,
    avatarId: pickString(obj, 'avatar_id', 'avatarId') ?? 'crown',
    presence: pickEnum(obj, PRESENCE_VALUES, 'offline', 'presence'),
    statusText: pickString(obj, 'status_text', 'statusText'),
    winStreak: pickNumber(obj, 'win_streak', 'winStreak') ?? 0,
    dailyWins: pickNumber(obj, 'daily_wins', 'dailyWins') ?? 0,
    dndUntil: pickNumber(obj, 'dnd_until', 'dndUntil'),
    isBot: pickBoolean(obj, 'is_bot', 'isBot'),
    ebartexUsername: pickString(obj, 'ebartex_username', 'ebartexUsername') ?? null,
  };
}

export function mapFriendSummaryList(raw: unknown): FriendSummary[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(mapFriendSummary).filter((item): item is FriendSummary => item !== null);
}

export function mapFriendRequest(raw: unknown): FriendRequestItem | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const id = pickString(obj, 'id');
  const gamertag = pickString(obj, 'gamertag');
  const direction = pickString(obj, 'direction');
  if (!id || !gamertag || (direction !== 'incoming' && direction !== 'outgoing')) return null;
  return {
    id,
    gamertag,
    avatarId: pickString(obj, 'avatar_id', 'avatarId') ?? 'crown',
    createdAtText: pickString(obj, 'created_at_text', 'createdAtText') ?? 'Recente',
    direction,
    isBot: pickBoolean(obj, 'is_bot', 'isBot'),
  };
}

export function mapFriendRequestList(raw: unknown): FriendRequestItem[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.map(mapFriendRequest).filter((item): item is FriendRequestItem => item !== null);
}

export function mapPublicPlayerProfile(raw: unknown): PublicPlayerProfile | null {
  const obj = asRecord(raw);
  if (!obj) return null;
  const gamertag = pickString(obj, 'gamertag');
  if (!gamertag) return null;
  const badges = asRecord(obj.honor_badges ?? obj.honorBadges) ?? {};
  const achievements = obj.unlocked_achievements ?? obj.unlockedAchievements;
  return {
    gamertag,
    avatarId: pickString(obj, 'avatar_id', 'avatarId') ?? 'crown',
    presence: pickEnum(obj, PRESENCE_VALUES, 'offline', 'presence'),
    stats: mapStats(obj.stats),
    unlockedAchievements: Array.isArray(achievements)
      ? achievements.filter((value): value is string => typeof value === 'string')
      : [],
    honorBadges: {
      friendly: pickNumber(badges, 'friendly') ?? 0,
      sportive: pickNumber(badges, 'sportive') ?? 0,
      great_player: pickNumber(badges, 'great_player') ?? 0,
      strategist: pickNumber(badges, 'strategist') ?? 0,
      punctual: pickNumber(badges, 'punctual') ?? 0,
    },
    friendship: pickEnum(obj, RELATION_VALUES, 'none', 'friendship'),
    dndUntil: pickNumber(obj, 'dnd_until', 'dndUntil'),
    isBot: pickBoolean(obj, 'is_bot', 'isBot'),
    ebartexUsername: pickString(obj, 'ebartex_username', 'ebartexUsername') ?? null,
    showEbartexProfile: pickBoolean(obj, 'show_ebartex_profile', 'showEbartexProfile'),
  };
}
