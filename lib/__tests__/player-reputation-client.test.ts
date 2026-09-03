import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tournamentFetch: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/access-token', () => ({ getAccessToken: vi.fn() }));
vi.mock('@/lib/data/gamertag-cache', () => ({
  getCachedGamertag: vi.fn(),
  getStaleGamertag: vi.fn(),
  setCachedGamertag: vi.fn(),
}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  tournamentFetch: mocks.tournamentFetch,
  extractApiError: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import { fetchMyReputation } from '@/lib/data/player-api-client';

describe('fetchMyReputation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mappa il totale autorevole delle partite da almeno trenta minuti', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        data: {
          played: 13,
          qualified_matches_30m: 10,
          wins: 7,
          losses: 6,
          abandoned: 0,
          disputed: 0,
          recent: [],
        },
      },
    });

    await expect(fetchMyReputation()).resolves.toMatchObject({
      played: 13,
      qualifiedMatches30m: 10,
    });
  });

  it('ricade su zero finché il backend non espone il nuovo aggregato', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: { played: 3, recent: [] } },
    });

    await expect(fetchMyReputation()).resolves.toMatchObject({ qualifiedMatches30m: 0 });
  });
});
