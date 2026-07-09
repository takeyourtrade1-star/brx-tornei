import { describe, expect, it } from 'vitest';
import { validateDeckLegality } from '@/lib/deck-legality';
import { card, deck, legalities } from './test-helpers';

describe('validateDeckLegality — taglie', () => {
  it('main sotto la soglia minima', () => {
    const d = deck([card('Forest', 59, { oracleId: 'forest' })]);
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.message.includes('Main deck incompleto'))).toBe(true);
  });

  it('sideboard oltre il massimo', () => {
    const d = deck(
      [card('Forest', 60, { oracleId: 'forest' })],
      [card('Island', 16, { oracleId: 'island' })]
    );
    const { issues } = validateDeckLegality(d);
    expect(issues.some((i) => i.message.includes('Sideboard eccessivo'))).toBe(true);
  });

  it('Commander: min 100 e niente sideboard', () => {
    const d = deck(
      [card('Forest', 100, { oracleId: 'forest' })],
      [card('Island', 1, { oracleId: 'island' })],
      'commander'
    );
    const { issues } = validateDeckLegality(d);
    expect(issues.some((i) => i.message.includes('Sideboard eccessivo'))).toBe(true);
  });
});

describe('validateDeckLegality — limiti copie', () => {
  it('mazzo legale con 4 copie esatte passa', () => {
    const d = deck([
      card('Lightning Bolt', 4, { oracleId: 'bolt' }),
      card('Forest', 56, { oracleId: 'forest' }),
    ]);
    expect(validateDeckLegality(d).legal).toBe(true);
  });

  it('5 copie tra stampe diverse dello stesso oracle', () => {
    const d = deck([
      card('Lightning Bolt', 3, { oracleId: 'bolt', setCode: 'm10' }),
      card('Lightning Bolt', 2, { oracleId: 'bolt', setCode: 'lea' }),
      card('Forest', 55, { oracleId: 'forest' }),
    ]);
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.cardName === 'Lightning Bolt' && i.message.includes('Max 4'))).toBe(
      true
    );
  });

  it('main + side contano insieme', () => {
    const d = deck(
      [card('Lightning Bolt', 4, { oracleId: 'bolt' }), card('Forest', 56, { oracleId: 'forest' })],
      [card('Lightning Bolt', 1, { oracleId: 'bolt' })]
    );
    expect(validateDeckLegality(d).legal).toBe(false);
  });

  it('terre base illimitate', () => {
    const d = deck([card('Forest', 60, { oracleId: 'forest' })]);
    expect(validateDeckLegality(d).legal).toBe(true);
  });

  it('Relentless Rats illimitate anche in Commander', () => {
    const d = deck(
      [
        card('Relentless Rats', 30, { oracleId: 'rats' }),
        card('Swamp', 70, { oracleId: 'swamp' }),
      ],
      [],
      'commander'
    );
    expect(validateDeckLegality(d).legal).toBe(true);
  });

  it('Seven Dwarves: 7 ok, 8 no — e il messaggio non è quello singleton', () => {
    const ok = deck(
      [card('Seven Dwarves', 7, { oracleId: 'dwarves' }), card('Forest', 93, { oracleId: 'forest' })],
      [],
      'commander'
    );
    expect(validateDeckLegality(ok).legal).toBe(true);

    const ko = deck(
      [card('Seven Dwarves', 8, { oracleId: 'dwarves' }), card('Forest', 92, { oracleId: 'forest' })],
      [],
      'commander'
    );
    const { legal, issues } = validateDeckLegality(ko);
    expect(legal).toBe(false);
    const issue = issues.find((i) => i.cardName === 'Seven Dwarves');
    expect(issue?.message).toContain('Max 7');
    expect(issue?.message).not.toContain('Commander: max 1');
  });

  it('Commander: seconda copia di una carta normale viola il singleton', () => {
    const d = deck(
      [card('Sol Ring', 2, { oracleId: 'sol-ring' }), card('Forest', 98, { oracleId: 'forest' })],
      [],
      'commander'
    );
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.message.includes('Commander: max 1'))).toBe(true);
  });

  it('ristretta: max 1 con messaggio dedicato', () => {
    const lotus = legalities('legal', { 'old-school': 'restricted' });
    const d = deck(
      [
        card('Black Lotus', 2, { oracleId: 'lotus', tournamentLegalities: lotus }),
        card('Forest', 58, { oracleId: 'forest' }),
      ],
      [],
      'old-school'
    );
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.status === 'restricted' && i.message.includes('ristretta'))).toBe(
      true
    );
  });
});

describe('validateDeckLegality — legalità per carta', () => {
  it('carta bannata segnalata', () => {
    const banned = legalities('legal', { modern: 'banned' });
    const d = deck([
      card('Oko, Thief of Crowns', 1, { oracleId: 'oko', tournamentLegalities: banned }),
      card('Forest', 59, { oracleId: 'forest' }),
    ]);
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.cardName === 'Oko, Thief of Crowns')).toBe(true);
  });

  it('carta non legale nel formato segnalata', () => {
    const notLegal = legalities('legal', { standard: 'not_legal' });
    const d = deck(
      [
        card('Counterspell', 1, { oracleId: 'cs', tournamentLegalities: notLegal }),
        card('Island', 59, { oracleId: 'island' }),
      ],
      [],
      'standard'
    );
    expect(validateDeckLegality(d).legal).toBe(false);
  });

  it('legalità mancante → non verificata', () => {
    const d = deck([
      card('Mystery Card', 1, { oracleId: 'mystery', tournamentLegalities: undefined }),
      card('Forest', 59, { oracleId: 'forest' }),
    ]);
    const { legal, issues } = validateDeckLegality(d);
    expect(legal).toBe(false);
    expect(issues.some((i) => i.message.includes('non verificata'))).toBe(true);
  });

  it('ristretta con 1 sola copia è legale', () => {
    const lotus = legalities('legal', { 'old-school': 'restricted' });
    const d = deck(
      [
        card('Black Lotus', 1, { oracleId: 'lotus', tournamentLegalities: lotus }),
        card('Forest', 59, { oracleId: 'forest' }),
      ],
      [],
      'old-school'
    );
    expect(validateDeckLegality(d).legal).toBe(true);
  });
});
