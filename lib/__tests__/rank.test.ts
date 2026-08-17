import { describe, expect, it } from 'vitest';
import { calculateDailyWins, calculateWinStreak, rankStarsForWins } from '@/lib/rank';
import type { ReputationSummary } from '@/lib/data/player-api-client';

describe('Rank & WinStreak Logic', () => {
  it('calcola correttamente le stelle di grado per vittorie giornaliere', () => {
    expect(rankStarsForWins(0)).toBe(1);
    expect(rankStarsForWins(1)).toBe(2);
    expect(rankStarsForWins(2)).toBe(3);
    expect(rankStarsForWins(3)).toBe(4);
    expect(rankStarsForWins(4)).toBe(5);
    expect(rankStarsForWins(10)).toBe(5);
  });

  it('calcola la win streak attuale partendo dal match più recente', () => {
    const rep: ReputationSummary = {
      played: 5,
      wins: 3,
      losses: 2,
      abandoned: 0,
      disputed: 0,
      recent: [
        {
          opponentGamertag: 'UserA',
          outcome: 'win',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: '2026-08-17T12:00:00Z', // più recente: vittoria
        },
        {
          opponentGamertag: 'UserB',
          outcome: 'win',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: '2026-08-17T11:00:00Z', // vittoria
        },
        {
          opponentGamertag: 'UserC',
          outcome: 'loss',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: '2026-08-17T10:00:00Z', // sconfitta -> streak interrotta
        },
        {
          opponentGamertag: 'UserD',
          outcome: 'win',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: '2026-08-17T09:00:00Z',
        },
      ],
      history: [],
    };

    expect(calculateWinStreak(rep)).toBe(2);
  });

  it('raggiunge on fire solo con 3 o più vittorie consecutive', () => {
    const makeRep = (outcomes: ('win' | 'loss')[]): ReputationSummary => ({
      played: outcomes.length,
      wins: outcomes.filter((o) => o === 'win').length,
      losses: outcomes.filter((o) => o === 'loss').length,
      abandoned: 0,
      disputed: 0,
      recent: outcomes.map((outcome, i) => ({
        opponentGamertag: `User${i}`,
        outcome,
        settledBy: 'manual',
        durationSeconds: 100,
        createdAt: new Date(Date.now() - i * 60000).toISOString(),
      })),
      history: [],
    });

    expect(calculateWinStreak(makeRep(['win']))).toBe(1);
    expect(calculateWinStreak(makeRep(['win', 'win']))).toBe(2);
    expect(calculateWinStreak(makeRep(['win', 'win', 'win']))).toBe(3);
    expect(calculateWinStreak(makeRep(['win', 'win', 'win', 'win']))).toBe(4);
    expect(calculateWinStreak(makeRep(['loss', 'win', 'win', 'win']))).toBe(0);
  });

  it('calcola le vittorie giornaliere solo nelle ultime 24 ore', () => {
    const rep: ReputationSummary = {
      played: 3,
      wins: 2,
      losses: 1,
      abandoned: 0,
      disputed: 0,
      recent: [
        {
          opponentGamertag: 'UserA',
          outcome: 'win',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 ore fa (oggi)
        },
        {
          opponentGamertag: 'UserB',
          outcome: 'win',
          settledBy: 'manual',
          durationSeconds: 120,
          createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), // 30 ore fa (ieri)
        },
      ],
      history: [],
    };

    expect(calculateDailyWins(rep)).toBe(1);
  });
});
