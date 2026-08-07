import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  evaluateAchievements,
  unlockedCount,
} from '@/lib/data/achievements';
import type { ReputationSummary } from '@/lib/data/player-api-client';

function rep(partial: Partial<ReputationSummary>): ReputationSummary {
  return {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
    ...partial,
  };
}

describe('achievements', () => {
  it('all definition entries are unique', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('zero stats → nessun badge sbloccato', () => {
    const unlocked = unlockedCount(rep({}));
    expect(unlocked.unlocked).toBe(0);
    expect(unlocked.total).toBe(ACHIEVEMENTS.length);
  });

  it('prima vittoria sblocca "Primo sangue"', () => {
    const list = evaluateAchievements(rep({ played: 1, wins: 1 }));
    const first = list.find((a) => a.id === 'first-win');
    expect(first?.unlockedNow).toBe(true);
  });

  it('prima sconfitta sblocca "Si impara cadendo"', () => {
    const list = evaluateAchievements(rep({ played: 1, losses: 1 }));
    expect(list.find((a) => a.id === 'first-loss')?.unlockedNow).toBe(true);
  });

  it('dieci partite senza abbandoni sbloccano "Fair play"', () => {
    const list = evaluateAchievements(rep({ played: 10, wins: 5, losses: 5, abandoned: 0 }));
    expect(list.find((a) => a.id === 'fair-play')?.unlockedNow).toBe(true);
  });

  it('un abbandono blocca "Fair play" anche con 10+ partite', () => {
    const list = evaluateAchievements(rep({ played: 12, wins: 6, losses: 5, abandoned: 1 }));
    expect(list.find((a) => a.id === 'fair-play')?.unlockedNow).toBe(false);
  });

  it('winrate 60%+ con 20 partite → "Mira chirurgica"', () => {
    const list = evaluateAchievements(rep({ played: 20, wins: 12, losses: 8 }));
    expect(list.find((a) => a.id === 'sharp-shooter')?.unlockedNow).toBe(true);
    const listLow = evaluateAchievements(rep({ played: 20, wins: 11, losses: 9 }));
    expect(listLow.find((a) => a.id === 'sharp-shooter')?.unlockedNow).toBe(false);
  });

  it('soglie progressive rispettano i target', () => {
    const r = rep({ played: 35, wins: 25, losses: 10 });
    const list = evaluateAchievements(r);
    expect(list.find((a) => a.id === 'ten-games')?.unlockedNow).toBe(true);
    expect(list.find((a) => a.id === 'ten-wins')?.unlockedNow).toBe(true);
    expect(list.find((a) => a.id === 'star-of-bridge')?.unlockedNow).toBe(true);
    expect(list.find((a) => a.id === 'fifty-wins')?.unlockedNow).toBe(false);
    expect(list.find((a) => a.id === 'veteran')?.unlockedNow).toBe(false);
  });
});
