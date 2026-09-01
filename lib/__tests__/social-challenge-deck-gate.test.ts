import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchMyGamertag: vi.fn(),
  gate: vi.fn(),
  createChallenge: vi.fn(),
  fetchChallenge: vi.fn(),
  respondChallenge: vi.fn(),
  cancelChallenge: vi.fn(),
  attachDeck: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/player-api-client', () => ({
  fetchMyGamertag: mocks.fetchMyGamertag,
}));
vi.mock('@/lib/join-deck-gate', () => ({
  assertDeclaredDeckRequirements: mocks.gate,
}));
vi.mock('@/lib/data/social-api-client', () => ({
  fetchActiveChallengeForUser: vi.fn(),
  fetchChallengeById: mocks.fetchChallenge,
  fetchOutgoingChallengeStatus: vi.fn(),
  postCancelGameChallenge: mocks.cancelChallenge,
  postCreateGameChallenge: mocks.createChallenge,
  postRespondGameChallenge: mocks.respondChallenge,
}));
vi.mock('@/lib/data/social-mock-store', () => ({
  isMockBot: () => false,
  isPlayerDnd: () => false,
}));
vi.mock('@/lib/data/tournaments', () => ({ leaveTournament: vi.fn() }));
vi.mock('@/lib/social-challenge-deck', () => ({
  attachChallengeDeck: mocks.attachDeck,
  createChallengeTableWithDeck: vi.fn(),
}));

import {
  respondGameChallengeAction,
  sendGameChallengeAction,
} from '@/actions/social-challenges';

const challenge = {
  id: 'challenge-1',
  challengerGamertag: 'Alice',
  challengerAvatarId: 'crown',
  recipientGamertag: 'Bob',
  format: 'modern',
  bestOf: 'BO3' as const,
  tableId: 'table-1',
  expiresAt: Date.now() + 60_000,
  status: 'pending' as const,
};

describe('dichiarazione mazzo nei duelli social', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Bob', email: 'bob@example.test' },
    });
    mocks.fetchMyGamertag.mockResolvedValue('Bob');
    mocks.gate.mockResolvedValue({ ok: true });
    mocks.createChallenge.mockResolvedValue(challenge);
    mocks.fetchChallenge.mockResolvedValue(challenge);
    mocks.respondChallenge.mockResolvedValue({ ...challenge, status: 'accepted' });
    mocks.attachDeck.mockResolvedValue({ id: 'table-1' });
  });

  it('non crea una sfida senza deck e applica il gate prima della mutazione', async () => {
    await expect(sendGameChallengeAction('Alice', 'modern', 'BO3', ''))
      .resolves.toMatchObject({ ok: false });
    expect(mocks.createChallenge).not.toHaveBeenCalled();

    await sendGameChallengeAction('Alice', 'modern', 'BO3', 'deck-1');
    expect(mocks.gate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createChallenge.mock.invocationCallOrder[0]!,
    );
    expect(mocks.attachDeck).toHaveBeenCalledWith('table-1', {
      userId: 'user-1', username: 'Bob', deckId: 'deck-1',
    });
  });

  it('non accetta senza deck e associa lo snapshot dopo la risposta backend', async () => {
    await expect(respondGameChallengeAction('challenge-1', 'accept'))
      .resolves.toMatchObject({ ok: false });
    expect(mocks.fetchChallenge).not.toHaveBeenCalled();

    mocks.fetchMyGamertag.mockResolvedValue('Charlie');
    await expect(respondGameChallengeAction('challenge-1', 'accept', 'deck-2'))
      .resolves.toEqual({ ok: true, data: { tableId: 'table-1' } });
    expect(mocks.gate).toHaveBeenCalledWith('user-1', {
      deckId: 'deck-2', format: 'modern', requireScryfall: false,
    });
    expect(mocks.respondChallenge).toHaveBeenCalledWith('challenge-1', 'accept');
    expect(mocks.attachDeck).toHaveBeenCalledWith('table-1', {
      userId: 'user-1', username: 'Charlie', deckId: 'deck-2',
    });
  });
});
