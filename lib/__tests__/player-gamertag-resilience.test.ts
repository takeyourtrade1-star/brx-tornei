import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tournamentFetch: vi.fn(),
  getAccessToken: vi.fn(),
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
vi.mock('@/lib/auth/access-token', () => ({
  getAccessToken: mocks.getAccessToken,
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
import { resetGamertagCache } from '@/lib/data/gamertag-cache';

describe('Player Gamertag Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetGamertagCache();
    mocks.getAccessToken.mockResolvedValue('access-token');
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

  describe('cache del profilo', () => {
    it('legge il profilo una sola volta per sessione', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: { gamertag: 'ASSO' },
      });

      await fetchMyGamertag();
      await fetchMyGamertag();
      await fetchMyGamertag();

      expect(mocks.tournamentFetch).toHaveBeenCalledTimes(1);
    });

    it('non condivide la entry tra token diversi', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: true,
        status: 200,
        body: { gamertag: 'ASSO' },
      });

      await fetchMyGamertag();
      mocks.getAccessToken.mockResolvedValue('altro-token');
      await fetchMyGamertag();

      expect(mocks.tournamentFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('requireGamertag', () => {
    it('sopravvive a un 429 riusando il gamertag gia noto', async () => {
      mocks.tournamentFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: { gamertag: 'ASSO' },
      });
      await fetchMyGamertag();

      mocks.tournamentFetch.mockResolvedValue({
        ok: false,
        status: 429,
        body: { detail: { code: 'RATE_LIMIT_EXCEEDED' } },
      });
      // Scaduta la finestra fresca, la entry resta leggibile come stale.
      const realNow = Date.now();
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(realNow + 10 * 60_000);
      try {
        await expect(requireGamertag('/tornei')).resolves.toBe('ASSO');
        expect(mocks.tournamentFetch).toHaveBeenCalledTimes(2);
        expect(mocks.redirect).not.toHaveBeenCalled();
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('propaga il 429 quando non c\'e nessun gamertag noto', async () => {
      mocks.tournamentFetch.mockResolvedValue({
        ok: false,
        status: 429,
        body: { detail: { code: 'RATE_LIMIT_EXCEEDED' } },
      });

      await expect(requireGamertag('/tornei')).rejects.toBeInstanceOf(TournamentApiError);
    });

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
