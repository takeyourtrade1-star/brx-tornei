import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tournamentFetch: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: { api: { tournamentsServiceToken: 'first-party-token' } },
}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  extractApiError: (_body: unknown, status: number, fallback: string) => {
    const error = new Error(fallback) as Error & { status: number };
    error.status = status;
    return error;
  },
  tournamentFetch: mocks.tournamentFetch,
  TournamentApiError: class TournamentApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
    ) {
      super(message);
    }
  },
}));

import {
  fetchSocialPreferences,
  mapSocialPreferences,
  updateSocialDnd,
  updateSocialEbartexVisibility,
} from '@/lib/data/social-preferences-client';

describe('client preferenze social', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mappa il contratto snake_case del servizio Tornei', () => {
    expect(
      mapSocialPreferences({
        data: { dnd_until: 2_000_000_000_000, show_ebartex_profile: false },
      }),
    ).toEqual({ dndUntil: 2_000_000_000_000, showEbartexProfile: false });
    expect(mapSocialPreferences({ data: { dnd_until: 'domani' } })).toBeNull();
  });

  it('usa GET e PATCH sul profilo autenticato', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: { dnd_until: null, show_ebartex_profile: true } },
    });

    await fetchSocialPreferences();
    await updateSocialDnd(true, 60, 'market_user');
    await updateSocialEbartexVisibility(false, 'market_user');

    expect(mocks.tournamentFetch).toHaveBeenNthCalledWith(
      1,
      '/api/v1/players/me/social-preferences',
      undefined,
    );
    expect(mocks.tournamentFetch).toHaveBeenNthCalledWith(
      2,
      '/api/v1/players/me/social-preferences',
      {
        method: 'PATCH',
        body: JSON.stringify({
          dnd_active: true,
          dnd_duration_minutes: 60,
          ebartex_username: 'market_user',
        }),
      },
    );
    expect(mocks.tournamentFetch).toHaveBeenNthCalledWith(
      3,
      '/api/v1/players/me/social-preferences',
      {
        method: 'PATCH',
        body: JSON.stringify({
          show_ebartex_profile: false,
          ebartex_username: 'market_user',
        }),
      },
    );
  });
});
