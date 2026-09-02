import { describe, expect, it } from 'vitest';
import {
  encodeMatchJudgeSignal,
  isMatchJudgeMessage,
  parseMatchJudgeSignal,
} from '@/lib/match-judge-protocol';

describe('Match Judge Protocol', () => {
  it('riconosce correttamente un messaggio del protocollo judge', () => {
    const encoded = encodeMatchJudgeSignal({ type: 'typing', senderId: 'user-1' });
    expect(isMatchJudgeMessage(encoded)).toBe(true);
    expect(isMatchJudgeMessage('ciao come stai?')).toBe(false);
  });

  it('codifica e decodifica un segnale typing', () => {
    const encoded = encodeMatchJudgeSignal({ type: 'typing', senderId: 'user-1', timestamp: 12345 });
    const parsed = parseMatchJudgeSignal(encoded);
    expect(parsed).toEqual({ type: 'typing', senderId: 'user-1', timestamp: 12345 });
  });

  it('codifica e decodifica un segnale thinking', () => {
    const encoded = encodeMatchJudgeSignal({ type: 'thinking', senderId: 'user-2', timestamp: 67890 });
    const parsed = parseMatchJudgeSignal(encoded);
    expect(parsed).toEqual({ type: 'thinking', senderId: 'user-2', timestamp: 67890 });
  });

  it('codifica e decodifica un segnale idle', () => {
    const encoded = encodeMatchJudgeSignal({ type: 'idle', senderId: 'user-1' });
    const parsed = parseMatchJudgeSignal(encoded);
    expect(parsed).toEqual({ type: 'idle', senderId: 'user-1' });
  });

  it('ignora frame corrotti o non conformi', () => {
    expect(parseMatchJudgeSignal('[[BRX_JUDGE_V1]]not-json')).toBeNull();
    expect(parseMatchJudgeSignal('[[BRX_JUDGE_V1]]{"type":"unknown"}')).toBeNull();
  });
});
