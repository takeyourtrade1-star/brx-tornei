import { DEFAULT_TOURNAMENT_SELECTION } from '@/lib/constants/tournament-defaults';
import { friendRequestSchema } from '@/lib/validations/social';

export const FRIEND_INVITE_QUERY = 'add';

export function parseFriendInviteGamertag(
  value: string | string[] | null | undefined,
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = friendRequestSchema.safeParse({ gamertag: raw });
  return parsed.success ? parsed.data.gamertag : null;
}

export function buildFriendInvitePath(gamertag: string): string {
  const parsed = parseFriendInviteGamertag(gamertag);
  if (!parsed) return '';
  const params = new URLSearchParams({
    format: DEFAULT_TOURNAMENT_SELECTION.format,
    mode: DEFAULT_TOURNAMENT_SELECTION.mode,
    [FRIEND_INVITE_QUERY]: parsed,
  });
  return `/tornei?${params.toString()}`;
}

export function buildFriendInviteUrl(origin: string, gamertag: string): string {
  const path = buildFriendInvitePath(gamertag);
  if (!path) return '';
  try {
    const base = new URL(origin);
    if (base.username || base.password || base.search || base.hash) return '';
    return `${base.origin}${path}`;
  } catch {
    return '';
  }
}

export function stripFriendInviteParam(search: string): string {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  params.delete(FRIEND_INVITE_QUERY);
  const next = params.toString();
  return next ? `?${next}` : '';
}
