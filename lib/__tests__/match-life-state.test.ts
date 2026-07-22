import { describe, expect, it } from 'vitest';
import {
  nextLifeCommandId,
  rememberLifeCommand,
} from '@/hooks/match-life-state';

describe('stato locale punti vita', () => {
  it('deduplica lo stesso comando senza perdere click rapidi distinti', () => {
    const commands = new Set<string>();
    const sequence = { current: 0 };
    const first = nextLifeCommandId(sequence, 'player-1');
    const second = nextLifeCommandId(sequence, 'player-1');

    expect(first).not.toBe(second);
    expect(rememberLifeCommand(commands, first)).toBe(false);
    expect(rememberLifeCommand(commands, first)).toBe(true);
    expect(rememberLifeCommand(commands, second)).toBe(false);
  });
});
