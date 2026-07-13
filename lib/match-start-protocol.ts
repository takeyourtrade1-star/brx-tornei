const MATCH_START_PREFIX = '[[BRX_START_V1]]';

export const MATCH_START_COUNTDOWN_MS = 5_000;

export type MatchStartCommand =
  | { type: 'announce'; startsAt: number; senderId: string }
  | { type: 'sync-request'; senderId: string };

export function encodeMatchStartCommand(command: MatchStartCommand): string {
  return `${MATCH_START_PREFIX}${JSON.stringify(command)}`;
}

export function parseMatchStartCommand(text: string): MatchStartCommand | null {
  if (!text.startsWith(MATCH_START_PREFIX)) return null;

  try {
    const value = JSON.parse(text.slice(MATCH_START_PREFIX.length)) as unknown;
    if (!isRecord(value) || typeof value.senderId !== 'string') return null;
    if (value.type === 'sync-request') return { type: 'sync-request', senderId: value.senderId };
    if (
      value.type === 'announce' &&
      typeof value.startsAt === 'number' &&
      Number.isFinite(value.startsAt) &&
      value.startsAt > 0
    ) {
      return { type: 'announce', startsAt: value.startsAt, senderId: value.senderId };
    }
  } catch {
    return null;
  }

  return null;
}

export function isMatchStartMessage(text: string): boolean {
  return text.startsWith(MATCH_START_PREFIX);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
