import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractApiError: vi.fn((_body: unknown, status: number, message: string) => {
    const error = new Error(message) as Error & { status: number };
    error.status = status;
    return error;
  }),
  tournamentFetch: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  extractApiError: mocks.extractApiError,
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
  ASSO_WORLD_LOOK_API_PATH,
  fetchAssoWorldLook,
  mapAssoWorldLook,
  updateAssoWorldLook,
} from '@/lib/data/asso-world-look-client';

describe('client server-only look Asso World', () => {
  beforeEach(() => vi.clearAllMocks());

  it('mappa il contratto canonico e gli alias solo in lettura', () => {
    expect(mapAssoWorldLook({ data: { look: 'look:f2:jersey' } })).toEqual({
      hair: 'f2',
      outfit: 'jersey',
    });
    expect(mapAssoWorldLook({ data: { world_look: 'look:m1:jacket' } })).toEqual({
      hair: 'm1',
      outfit: 'jacket',
    });
    expect(mapAssoWorldLook({ data: { avatar_id: 'look:f1:shirt' } })).toEqual({
      hair: 'f1',
      outfit: 'shirt',
    });
    expect(mapAssoWorldLook({ data: {} })).toEqual({ hair: 'm3', outfit: 'tank' });
    expect(mapAssoWorldLook({ data: { look: 'look:m1:invalid' } })).toBeNull();
  });

  it('usa GET e PATCH sul profilo autenticato con una sola chiave look', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: { look: 'look:m3:tank' } },
    });

    await expect(fetchAssoWorldLook()).resolves.toEqual({ hair: 'm3', outfit: 'tank' });
    await expect(updateAssoWorldLook({ hair: 'f3', outfit: 'hoodie' })).resolves.toEqual({
      hair: 'm3',
      outfit: 'tank',
    });

    expect(mocks.tournamentFetch).toHaveBeenNthCalledWith(1, ASSO_WORLD_LOOK_API_PATH, undefined);
    expect(mocks.tournamentFetch).toHaveBeenNthCalledWith(2, ASSO_WORLD_LOOK_API_PATH, {
      method: 'PATCH',
      body: JSON.stringify({ look: 'look:f3:hoodie' }),
    });
  });

  it('non accetta una risposta backend non canonica', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: { look: 'crown' } },
    });

    await expect(fetchAssoWorldLook()).rejects.toMatchObject({
      status: 502,
      code: 'INVALID_RESPONSE',
    });
  });
});
