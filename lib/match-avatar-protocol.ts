const MATCH_AVATAR_PREFIX = '[[BRX_AVATAR_V1]]';

export type MatchAvatarCommand =
  | { type: 'announce'; senderId: string; avatarId: string }
  | { type: 'sync-request'; senderId: string };

export function encodeMatchAvatarCommand(command: MatchAvatarCommand): string {
  return `${MATCH_AVATAR_PREFIX}${JSON.stringify(command)}`;
}

export function parseMatchAvatarCommand(text: string): MatchAvatarCommand | null {
  if (!text.startsWith(MATCH_AVATAR_PREFIX)) return null;

  try {
    const value = JSON.parse(text.slice(MATCH_AVATAR_PREFIX.length)) as unknown;
    if (!isRecord(value) || typeof value.senderId !== 'string') return null;
    if (value.type === 'sync-request') {
      return { type: 'sync-request', senderId: value.senderId };
    }
    if (
      value.type === 'announce' &&
      typeof value.avatarId === 'string' &&
      value.avatarId.length > 0 &&
      value.avatarId.length <= 40
    ) {
      return {
        type: 'announce',
        senderId: value.senderId,
        avatarId: value.avatarId,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function isMatchAvatarMessage(text: string): boolean {
  return text.startsWith(MATCH_AVATAR_PREFIX);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
