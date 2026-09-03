import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchMyReputation: vi.fn(),
  setCookie: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({ set: mocks.setCookie })),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/player-api-client', () => ({
  fetchMyReputation: mocks.fetchMyReputation,
}));
vi.mock('@/lib/data/decks', () => ({
  createDeck: vi.fn(),
  deleteDeck: vi.fn(),
  getDeckById: vi.fn(),
  listDecks: vi.fn(),
  saveDeckCards: vi.fn(),
  saveDeckVerification: vi.fn(),
}));

import { saveDefaultPlaymatAction } from '@/actions/decks';
import { PLAYMATS } from '@/lib/playmats';

function reputation(qualifiedMatches30m: number) {
  return {
    played: qualifiedMatches30m,
    qualifiedMatches30m,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
}

describe('saveDefaultPlaymatAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.fetchMyReputation.mockResolvedValue(reputation(0));
  });

  it('salva uno dei tre tappetini iniziali', async () => {
    await expect(saveDefaultPlaymatAction({ playmatId: PLAYMATS[2].id }))
      .resolves.toEqual({ ok: true });
    expect(mocks.setCookie).toHaveBeenCalled();
    expect(mocks.fetchMyReputation).not.toHaveBeenCalled();
  });

  it('rifiuta lato server un tappetino non ancora sbloccato', async () => {
    await expect(saveDefaultPlaymatAction({ playmatId: PLAYMATS[3].id }))
      .resolves.toEqual({
        error: 'Tappetino bloccato: servono 5 partite da almeno 30 minuti.',
      });
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('sblocca il quarto tappetino alla quinta partita qualificata', async () => {
    mocks.fetchMyReputation.mockResolvedValue(reputation(5));

    await expect(saveDefaultPlaymatAction({ playmatId: PLAYMATS[3].id }))
      .resolves.toEqual({ ok: true });
    expect(mocks.setCookie).toHaveBeenCalled();
  });

  it('non salva se il progresso autorevole non è verificabile', async () => {
    mocks.fetchMyReputation.mockRejectedValue(new Error('backend non disponibile'));

    await expect(saveDefaultPlaymatAction({ playmatId: PLAYMATS[3].id }))
      .resolves.toEqual({ error: 'Impossibile verificare gli sblocchi. Riprova tra poco.' });
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});
