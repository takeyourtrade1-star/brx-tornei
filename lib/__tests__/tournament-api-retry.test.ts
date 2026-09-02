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
vi.mock('@/lib/data/first-party-headers', () => ({
  firstPartyHeaders: () => Promise.resolve({ 'X-Ebartex-Service-Token': 'tok' }),
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

  it('non ritenta mai un 429: il retry raddoppierebbe il carico sul limiter', async () => {
    // Il limiter del backend conta su finestre al minuto: un secondo tentativo
    // immediato fallisce garantito e consuma un altro slot del bucket per-IP.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 429 }))
      .mockResolvedValueOnce(new Response('{"data":[]}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await tournamentFetch('/api/v1/tournaments');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ ok: false, status: 429 });
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

  it('dichiara sempre l identita di prima parte al backend', async () => {
    // Senza questo header il Tournament Service conta tutta l'utenza sulla
    // quota per-indirizzo del nostro unico IP di uscita.
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await tournamentFetch('/api/v1/tournaments');

    const sent = fetchMock.mock.calls[0]![1].headers as Record<string, string>;
    expect(sent['X-Ebartex-Service-Token']).toBe('tok');
  });

  it('non lascia sovrascrivere l identita dal chiamante', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"data":[]}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await tournamentFetch('/api/v1/tournaments', {
      headers: { 'X-Ebartex-Service-Token': 'spoof' },
    });

    const sent = fetchMock.mock.calls[0]![1].headers as Record<string, string>;
    expect(sent['X-Ebartex-Service-Token']).toBe('tok');
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
