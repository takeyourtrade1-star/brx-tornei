import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  tournamentFetch: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {
    readonly status: number;
    readonly code?: string;

    constructor(message: string, status: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

vi.mock('@/lib/data/tournament-api-client', () => ({
  tournamentFetch: mocks.tournamentFetch,
  TournamentApiError: mocks.TournamentApiError,
  extractApiError: (body: unknown, status: number, fallback: string) => {
    const detail = body && typeof body === 'object'
      ? (body as Record<string, unknown>).detail
      : null;
    return new mocks.TournamentApiError(
      typeof detail === 'string' ? detail : fallback,
      status,
    );
  },
}));

import {
  MAX_DECKS_PER_USER,
  createDeck,
  deleteDeck,
  listDecks,
  saveDeckCards,
} from '@/lib/data/decks';
import { MAX_DECKS_PER_USER as PRESENTED_DECK_LIMIT } from '@/lib/deck-limits';
import { mapDeckFromApi } from '@/lib/data/deck-api-mapper';
import { createDeckSchema } from '@/lib/validations/deck';

const apiDeck = {
  id: 'a2adf223-b189-45e4-972b-42962b81be9f',
  name: 'Mono Red',
  formatId: 'modern',
  archetypeId: 'burn',
  main: [],
  side: [],
  createdAt: '2026-08-20T12:00:00+00:00',
  verificationStatus: 'none',
};

describe('Deck API client', () => {
  beforeEach(() => {
    mocks.tournamentFetch.mockReset();
  });

  it('usa lo stesso limite nel client e nel data layer', () => {
    expect(MAX_DECKS_PER_USER).toBe(3);
    expect(MAX_DECKS_PER_USER).toBe(PRESENTED_DECK_LIMIT);
  });

  it('normalizza il nome e rifiuta un nome composto solo da spazi', () => {
    const base = { formatId: 'modern', archetypeId: 'burn' };
    expect(createDeckSchema.parse({ ...base, name: '  Mono Red  ' }).name).toBe(
      'Mono Red',
    );
    expect(createDeckSchema.safeParse({ ...base, name: '   ' }).success).toBe(false);
  });

  it('mappa il contratto backend e rifiuta payload incompleti', () => {
    expect(mapDeckFromApi(apiDeck)).toMatchObject({
      id: apiDeck.id,
      formatId: 'modern',
      verificationStatus: 'none',
    });
    expect(mapDeckFromApi({ ...apiDeck, formatId: 'inventato' })).toBeNull();
    expect(mapDeckFromApi({ ...apiDeck, main: 'non-array' })).toBeNull();
  });

  it('carica la lista annidata in data', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: { data: [apiDeck] },
    });

    await expect(listDecks('ignored-client-user-id')).resolves.toEqual([
      expect.objectContaining({ id: apiDeck.id, name: 'Mono Red' }),
    ]);
    expect(mocks.tournamentFetch).toHaveBeenCalledWith('/api/v1/decks');
  });

  it('crea il mazzo senza inviare userId dal client', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 201,
      body: { data: apiDeck },
    });

    await createDeck('must-not-reach-backend', {
      name: 'Mono Red',
      formatId: 'modern',
      archetypeId: 'burn',
    });

    expect(mocks.tournamentFetch).toHaveBeenCalledWith('/api/v1/decks', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Mono Red',
        formatId: 'modern',
        archetypeId: 'burn',
      }),
    });
  });

  it('salva le carte con PATCH e mantiene le chiavi camelCase', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        data: {
          ...apiDeck,
          verificationStatus: 'declared',
          main: [{ id: 'bolt', name: 'Lightning Bolt', quantity: 4 }],
        },
      },
    });

    await saveDeckCards('ignored', apiDeck.id, [
      { id: 'bolt', name: 'Lightning Bolt', quantity: 4 },
    ], []);

    expect(mocks.tournamentFetch).toHaveBeenCalledWith(
      `/api/v1/decks/${apiDeck.id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          main: [{ id: 'bolt', name: 'Lightning Bolt', quantity: 4 }],
          side: [],
          verificationStatus: 'declared',
        }),
      },
    );
  });

  it('tratta il DELETE 204 come successo e il 404 come già assente', async () => {
    mocks.tournamentFetch
      .mockResolvedValueOnce({ ok: true, status: 204, body: {} })
      .mockResolvedValueOnce({ ok: false, status: 404, body: {} });

    await expect(deleteDeck('ignored', apiDeck.id)).resolves.toBe(true);
    await expect(deleteDeck('ignored', apiDeck.id)).resolves.toBe(false);
  });
});
