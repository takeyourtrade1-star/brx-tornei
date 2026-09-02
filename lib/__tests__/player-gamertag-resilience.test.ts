import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tournamentFetch: vi.fn(),
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`);
    (error as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url}`;
    throw error;
  }),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
}));

vi.mock('@/lib/data/tournament-api-client', () => {
  class TournamentApiError extends Error {
    readonly status: number;
    readonly code?: string;
    constructor(message: string, status: number, code?: string) {
      super(message);
      this.name = 'TournamentApiError';
      this.status = status;
      this.code = code;
    }
  }

  return {
    tournamentFetch: mocks.tournamentFetch,
    TournamentApiError,
    extractApiError: (body: unknown, status: number, fallback: string) =>
      new TournamentApiError(fallback, status),
  };
});

import { fetchMyGamertag } from '@/lib/data/player-api-client';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { TournamentApiError } from '@/lib/data/tournament-api-client';

describe('Player Gamertag Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchMyGamertag', () => {
    it('restituisce null quando il profilo non esiste (status 404)', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: false,
        status: 404,
        body: { detail: 'Player not found' },
      });

      const gamertag = await fetchMyGamertag();

      expect(gamertag).toBeNull();
    });

    it('restituisce il gamertag quando presente (status 200)', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: { data: { gamertag: 'DuelMaster' } },
      });

      const gamertag = await fetchMyGamertag();

      expect(gamertag).toBe('DuelMaster');
    });

    it('lancia TournamentApiError su altri errori (es. 500)', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: false,
        status: 500,
        body: { detail: 'Internal Server Error' },
      });

      await expect(fetchMyGamertag()).rejects.toThrow('Impossibile leggere il profilo giocatore');
    });
  });

  describe('requireGamertag', () => {
    it('reindirizza a /imposta-username quando il profilo risponde 404 (nuovo utente)', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: false,
        status: 404,
        body: null,
      });

      await expect(requireGamertag('/tornei')).rejects.toThrow('NEXT_REDIRECT: /imposta-username?redirect=%2Ftornei');
      expect(mocks.redirect).toHaveBeenCalledWith('/imposta-username?redirect=%2Ftornei');
    });

    it('reindirizza a /login quando la sessione riceve 401', async () => {
      mocks.tournamentFetch.mockRejectedValue(
        new TournamentApiError('Sessione non valida', 401, 'UNAUTHORIZED'),
      );

      await expect(requireGamertag('/tornei')).rejects.toThrow('NEXT_REDIRECT: /login');
      expect(mocks.redirect).toHaveBeenCalledWith('/login');
    });
  });
});
