import { describe, expect, it } from 'vitest';
import {
  getRequiredQualifyingMatches,
  getUnlockedCosmeticCount,
  isCosmeticIndexUnlocked,
} from '@/lib/cosmetic-unlocks';
import { isPlaymatUnlocked, PLAYMATS } from '@/lib/playmats';

describe('progressione cosmetici', () => {
  it('lascia sbloccate soltanto le prime tre opzioni all’inizio', () => {
    expect(getUnlockedCosmeticCount(10, 0)).toBe(3);
    expect(isCosmeticIndexUnlocked(2, 0)).toBe(true);
    expect(isCosmeticIndexUnlocked(3, 0)).toBe(false);
  });

  it('sblocca una nuova opzione ogni cinque partite qualificate', () => {
    expect(getUnlockedCosmeticCount(10, 4)).toBe(3);
    expect(getUnlockedCosmeticCount(10, 5)).toBe(4);
    expect(getUnlockedCosmeticCount(10, 10)).toBe(5);
    expect(getUnlockedCosmeticCount(10, 35)).toBe(10);
  });

  it('applica le soglie progressive al catalogo dei tappetini', () => {
    expect(isPlaymatUnlocked(PLAYMATS[3].id, 4)).toBe(false);
    expect(isPlaymatUnlocked(PLAYMATS[3].id, 5)).toBe(true);
    expect(getRequiredQualifyingMatches(9)).toBe(35);
  });

  it('normalizza valori negativi o non finiti', () => {
    expect(getUnlockedCosmeticCount(10, -5)).toBe(3);
    expect(getUnlockedCosmeticCount(10, Number.NaN)).toBe(3);
    expect(getUnlockedCosmeticCount(2, 100)).toBe(2);
  });
});
