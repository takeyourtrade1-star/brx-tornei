const JUDGE_PREFIX = '[[BRX_JUDGE_V1]]';

export type MatchJudgeSignalType = 'typing' | 'thinking' | 'idle';

export interface MatchJudgeSignal {
  type: MatchJudgeSignalType;
  senderId: string;
  timestamp?: number;
}

export function encodeMatchJudgeSignal(signal: MatchJudgeSignal): string {
  return `${JUDGE_PREFIX}${JSON.stringify(signal)}`;
}

export function parseMatchJudgeSignal(text: string): MatchJudgeSignal | null {
  if (!text.startsWith(JUDGE_PREFIX)) return null;

  try {
    const value = JSON.parse(text.slice(JUDGE_PREFIX.length)) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const obj = value as Record<string, unknown>;
    if (typeof obj.senderId !== 'string' || typeof obj.type !== 'string') return null;

    if (obj.type === 'typing' || obj.type === 'thinking') {
      const timestamp = typeof obj.timestamp === 'number' ? obj.timestamp : Date.now();
      return { type: obj.type, senderId: obj.senderId, timestamp };
    }
    if (obj.type === 'idle') {
      return { type: 'idle', senderId: obj.senderId };
    }
  } catch {
    return null;
  }

  return null;
}

export function isMatchJudgeMessage(text: string): boolean {
  return text.startsWith(JUDGE_PREFIX);
}
