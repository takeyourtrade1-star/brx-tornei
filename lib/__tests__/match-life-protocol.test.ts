import { describe, expect, it } from 'vitest';
import {
  clampLife,
  encodeMatchLifeCommand,
  isMatchLifeMessage,
  parseMatchLifeCommand,
} from '@/lib/match-life-protocol';

describe('protocollo punti vita', () => {
  it('codifica e decodifica una variazione', () => {
    const command = { type: 'delta', targetId: 'player-2', delta: -5, senderId: 'player-1' } as const;
    const encoded = encodeMatchLifeCommand(command);

    expect(isMatchLifeMessage(encoded)).toBe(true);
    expect(parseMatchLifeCommand(encoded)).toEqual(command);
  });

  it('rifiuta payload non validi', () => {
    expect(parseMatchLifeCommand('ciao')).toBeNull();
    expect(parseMatchLifeCommand('[[BRX_LIFE_V1]]{"type":"delta","delta":1000}')).toBeNull();
  });

  it('limita la vita tra zero e 999', () => {
    expect(clampLife(-3)).toBe(0);
    expect(clampLife(42.4)).toBe(42);
    expect(clampLife(1200)).toBe(999);
  });
});
