import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/config', () => ({
  config: {
    api: {
      tournamentsBaseURL: 'https://tournaments.example.com',
      timeout: 1_000,
    },
  },
}));
vi.mock('@/lib/auth/session', () => ({
  getAccessToken: mocks.getAccessToken,
}));
vi.mock('@/lib/security/bounded-response', () => ({
  readBoundedResponseJson: (response: Response) => response.json(),
}));

import { tournamentFetch } from '@/lib/data/tournament-api-client';

describe('tournamentFetch retry policy', () => {
  beforeEach(() => {
    mocks.getAccessToken.mockResolvedValue('access-token');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('ritenta una lettura dopo un 5xx transitorio', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockResolvedValueOnce(new Response('{"data":[]}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tournamentFetch('/api/v1/tournaments');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ ok: true, status: 200 });
  });

  it('ritenta una lettura dopo un errore di rete transitorio', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('connection reset'))
      .mockResolvedValueOnce(new Response('{"data":{}}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tournamentFetch('/api/v1/players/me/profile');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
  });

  it('non ritenta mai una mutazione', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tournamentFetch('/api/v1/tournaments', {
      method: 'POST',
      body: '{}',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, status: 503 });
  });
});
