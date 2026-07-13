export const DEFAULT_STARTING_LIFE = 20;
export const STARTING_LIFE_OPTIONS = [20, 30, 40] as const;

const LIFE_PREFIX = '[[BRX_LIFE_V1]]';

export type MatchLifeCommand =
  | { type: 'setup'; startingLife: number; senderId: string }
  | { type: 'delta'; targetId: string; delta: number; senderId: string }
  | {
      type: 'snapshot';
      startingLife: number;
      lifeByPlayerId: Record<string, number>;
      senderId: string;
    }
  | { type: 'sync-request'; senderId: string };

export function encodeMatchLifeCommand(command: MatchLifeCommand): string {
  return `${LIFE_PREFIX}${JSON.stringify(command)}`;
}

export function parseMatchLifeCommand(text: string): MatchLifeCommand | null {
  if (!text.startsWith(LIFE_PREFIX)) return null;

  try {
    const value = JSON.parse(text.slice(LIFE_PREFIX.length)) as unknown;
    if (!isRecord(value) || typeof value.type !== 'string' || typeof value.senderId !== 'string') {
      return null;
    }

    if (value.type === 'setup' && isLife(value.startingLife)) {
      return { type: 'setup', startingLife: value.startingLife, senderId: value.senderId };
    }
    if (
      value.type === 'delta' &&
      typeof value.targetId === 'string' &&
      typeof value.delta === 'number' &&
      Number.isInteger(value.delta) &&
      Math.abs(value.delta) <= 100
    ) {
      return {
        type: 'delta',
        targetId: value.targetId,
        delta: value.delta,
        senderId: value.senderId,
      };
    }
    if (
      value.type === 'snapshot' &&
      isLife(value.startingLife) &&
      isLifeMap(value.lifeByPlayerId)
    ) {
      return {
        type: 'snapshot',
        startingLife: value.startingLife,
        lifeByPlayerId: value.lifeByPlayerId,
        senderId: value.senderId,
      };
    }
    if (value.type === 'sync-request') return { type: 'sync-request', senderId: value.senderId };
  } catch {
    return null;
  }

  return null;
}

export function isMatchLifeMessage(text: string): boolean {
  return text.startsWith(LIFE_PREFIX);
}

export function clampLife(value: number): number {
  return Math.max(0, Math.min(999, Math.round(value)));
}

function isLife(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= 999;
}

function isLifeMap(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every(isLifeValue);
}

function isLifeValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 999;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
