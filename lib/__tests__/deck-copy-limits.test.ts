import { describe, expect, it } from 'vitest';
import {
  getMaxCopiesForCard,
  getMaxQuantityForDeckRow,
  getRemainingCopies,
  isBasicLandName,
  UNLIMITED_COPIES,
} from '@/lib/deck-copy-limits';
import { card, legalities } from './test-helpers';

describe('getMaxCopiesForCard', () => {
  it('terre base senza limite, anche innevate', () => {
    expect(getMaxCopiesForCard('modern', card('Island', 1))).toBe(UNLIMITED_COPIES);
    expect(getMaxCopiesForCard('commander', card('Snow-Covered Forest', 1))).toBe(
      UNLIMITED_COPIES
    );
    expect(isBasicLandName('  MOUNTAIN ')).toBe(true);
  });

  it('carte "any number" senza limite anche in Commander', () => {
    expect(getMaxCopiesForCard('commander', card('Relentless Rats', 1))).toBe(UNLIMITED_COPIES);
    expect(getMaxCopiesForCard('modern', card("Dragon's Approach", 1))).toBe(UNLIMITED_COPIES);
  });

  it('limiti stampati sulla carta (valgono anche in Commander)', () => {
    expect(getMaxCopiesForCard('standard', card('Seven Dwarves', 1))).toBe(7);
    expect(getMaxCopiesForCard('commander', card('Seven Dwarves', 1))).toBe(7);
    expect(getMaxCopiesForCard('modern', card('Nazgûl', 1))).toBe(9);
  });

  it('ristretta nel formato → max 1', () => {
    const restricted = card('Black Lotus', 1, {
      tournamentLegalities: legalities('legal', { 'old-school': 'restricted' }),
    });
    expect(getMaxCopiesForCard('old-school', restricted)).toBe(1);
    expect(getMaxCopiesForCard('legacy', restricted)).toBe(4);
  });

  it('default: 1 in Commander, 4 altrove', () => {
    expect(getMaxCopiesForCard('commander', card('Lightning Bolt', 1))).toBe(1);
    expect(getMaxCopiesForCard('modern', card('Lightning Bolt', 1))).toBe(4);
  });
});

describe('getRemainingCopies', () => {
  it('conta le copie tra main e side sullo stesso oracle', () => {
    const inMain = card('Lightning Bolt', 2, { oracleId: 'bolt' });
    const inSide = card('Lightning Bolt', 1, { oracleId: 'bolt' });
    expect(getRemainingCopies('modern', inMain, [inMain], [inSide])).toBe(1);
  });

  it('stampe diverse dello stesso oracle contano insieme', () => {
    const printA = card('Lightning Bolt', 3, { oracleId: 'bolt', setCode: 'm10' });
    const printB = card('Lightning Bolt', 1, { oracleId: 'bolt', setCode: 'lea' });
    expect(getRemainingCopies('modern', printA, [printA, printB], [])).toBe(0);
  });

  it('il limite del gruppo è il più severo tra le stampe', () => {
    // Una stampa sa di essere ristretta, l'altra non è ancora arricchita.
    const known = card('Sol Ring', 1, {
      oracleId: 'sol-ring',
      tournamentLegalities: legalities('legal', { 'old-school': 'restricted' }),
    });
    const unknown = card('Sol Ring', 1, {
      oracleId: 'sol-ring',
      tournamentLegalities: undefined,
    });
    expect(getRemainingCopies('old-school', unknown, [known], [])).toBe(0);
  });

  it('mai negativo', () => {
    const five = card('Lightning Bolt', 5, { oracleId: 'bolt' });
    expect(getRemainingCopies('modern', five, [five], [])).toBe(0);
  });
});

describe('getMaxQuantityForDeckRow', () => {
  it('sottrae le copie nella sezione opposta', () => {
    const inMain = card('Lightning Bolt', 2, { oracleId: 'bolt' });
    const inSide = card('Lightning Bolt', 1, { oracleId: 'bolt' });
    expect(getMaxQuantityForDeckRow('modern', inMain, [inMain], [inSide], 'main')).toBe(3);
    expect(getMaxQuantityForDeckRow('modern', inSide, [inMain], [inSide], 'side')).toBe(2);
  });

  it('terre base senza tetto pratico', () => {
    const basics = card('Forest', 24, { oracleId: 'forest' });
    expect(getMaxQuantityForDeckRow('modern', basics, [basics], [], 'main')).toBe(
      UNLIMITED_COPIES
    );
  });
});
