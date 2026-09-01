import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  gate: vi.fn(),
  create: vi.fn(),
  join: vi.fn(),
  leave: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/join-deck-gate', () => ({
  assertDeclaredDeckRequirements: mocks.gate,
  assertJoinDeckRequirements: vi.fn(),
  requiresDeclaredDeckForJoin: () => true,
}));
vi.mock('@/lib/data/tournaments', () => ({
  createTournament: mocks.create,
  joinTournament: mocks.join,
  leaveTournament: mocks.leave,
  readyTournament: vi.fn(),
  getTournamentById: vi.fn(),
}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  TournamentApiError: class TournamentApiError extends Error {
    status = 500;
    code?: string;
  },
}));

import { createTableAction } from '@/actions/tournaments';

describe('creazione tavolo con dichiarazione mazzo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Duellante', email: 'u@example.test' },
    });
    mocks.gate.mockResolvedValue({ ok: true });
    mocks.create.mockResolvedValue({ id: 'table-1', webcamSessionId: 'webcam-1' });
    mocks.join.mockResolvedValue({
      tournament: { id: 'table-1', webcamSessionId: 'webcam-1' },
    });
    mocks.leave.mockResolvedValue(undefined);
  });

  it('non muta il backend senza una dichiarazione valida', async () => {
    await expect(createTableAction('modern', 'heads-up')).resolves.toMatchObject({
      error: expect.stringContaining('Dichiara il mazzo'),
    });
    expect(mocks.gate).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('valida prima di creare e associa subito lo snapshot al creatore', async () => {
    await expect(createTableAction('modern', 'heads-up', 'deck-1')).resolves.toEqual({
      createdId: 'table-1',
      webcamSessionId: 'webcam-1',
    });
    expect(mocks.gate).toHaveBeenCalledWith('user-1', {
      deckId: 'deck-1',
      format: 'modern',
      requireScryfall: false,
    });
    expect(mocks.gate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.create.mock.invocationCallOrder[0]!,
    );
    expect(mocks.join).toHaveBeenCalledWith(
      'table-1',
      { id: 'user-1', username: 'Duellante' },
      'deck-1',
    );
  });

  it('libera il tavolo se l’associazione backend del mazzo fallisce', async () => {
    mocks.join.mockRejectedValueOnce(new Error('join failed'));
    await expect(createTableAction('modern', 'heads-up', 'deck-1')).resolves.toEqual({
      error: 'join failed',
    });
    expect(mocks.leave).toHaveBeenCalledWith('table-1');
  });
});
