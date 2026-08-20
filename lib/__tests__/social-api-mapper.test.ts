import { describe, expect, it } from 'vitest';

import {
  mapFriendRequestList,
  mapFriendSummaryList,
  mapPublicPlayerProfile,
} from '@/lib/data/social-api-mapper';

describe('social API mapper', () => {
  it('mappa gli amici snake_case e preserva lo stato offline', () => {
    const result = mapFriendSummaryList([
      {
        gamertag: 'PlayerOffline',
        avatar_id: 'shield',
        presence: 'offline',
        status_text: 'Non attivo di recente',
        win_streak: 2,
        daily_wins: 1,
        ebartex_username: 'seller-name',
      },
    ]);

    expect(result).toEqual([
      expect.objectContaining({
        gamertag: 'PlayerOffline',
        avatarId: 'shield',
        presence: 'offline',
        statusText: 'Non attivo di recente',
        winStreak: 2,
        dailyWins: 1,
        ebartexUsername: 'seller-name',
      }),
    ]);
  });

  it('mappa richieste e profili pubblici senza affidarsi al cast TypeScript', () => {
    expect(mapFriendRequestList([
      {
        id: '0dfe73ee-a60e-4035-98a1-f5c24cd8ee41',
        gamertag: 'Opponent',
        avatar_id: 'crown',
        created_at_text: 'Oggi',
        direction: 'incoming',
      },
    ])?.[0]).toMatchObject({ avatarId: 'crown', createdAtText: 'Oggi' });

    expect(mapPublicPlayerProfile({
      gamertag: 'Opponent',
      avatar_id: 'flame',
      presence: 'recent',
      stats: { played: 3, wins: 2, win_streak: 2, daily_wins: 1 },
      unlocked_achievements: ['first-win'],
      honor_badges: { friendly: 4 },
      friendship: 'friend',
      show_ebartex_profile: true,
    })).toMatchObject({
      avatarId: 'flame',
      presence: 'recent',
      friendship: 'friend',
      stats: { played: 3, wins: 2, winStreak: 2, dailyWins: 1 },
      honorBadges: { friendly: 4 },
      unlockedAchievements: ['first-win'],
      showEbartexProfile: true,
    });
  });

  it('rifiuta payload social con forma non valida', () => {
    expect(mapFriendSummaryList({ data: [] })).toBeNull();
    expect(mapFriendRequestList([{ id: 'missing-fields' }])).toEqual([]);
    expect(mapPublicPlayerProfile({ presence: 'online' })).toBeNull();
  });
});
