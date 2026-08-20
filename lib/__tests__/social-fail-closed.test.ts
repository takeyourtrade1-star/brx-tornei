import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tournamentFetch: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { features: { ephemeralSocial: false } },
}));
vi.mock('@/lib/data/tournament-api-client', () => {
  class TournamentApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
    ) {
      super(message);
    }
  }
  return {
    tournamentFetch: mocks.tournamentFetch,
    TournamentApiError,
    extractApiError: (_body: unknown, status: number, fallback: string) =>
      new TournamentApiError(fallback, status),
  };
});

import { fetchFriendsList } from '@/lib/data/social-api-client';
import { postSendFriendRequest } from '@/lib/data/social-friendship-client';

describe('social production boundary', () => {
  beforeEach(() => {
    mocks.tournamentFetch.mockReset();
    mocks.tournamentFetch.mockResolvedValue({
      ok: false,
      status: 404,
      body: { detail: 'Not Found' },
    });
  });

  it('non trasforma un POST 404 in una richiesta mock riuscita', async () => {
    await expect(postSendFriendRequest('Opponent', 'Me')).rejects.toMatchObject({ status: 404 });
  });

  it('non trasforma un GET 404 in una lista mock', async () => {
    await expect(fetchFriendsList('Me')).rejects.toMatchObject({ status: 404 });
  });
});
