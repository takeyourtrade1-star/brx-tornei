import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  declaredGate: vi.fn(),
  joinGate: vi.fn(),
  requiresDeck: vi.fn(),
  create: vi.fn(),
  join: vi.fn(),
  getTournament: vi.fn(),
  leave: vi.fn(),
  revalidate: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/join-deck-gate', () => ({
  assertDeclaredDeckRequirements: mocks.declaredGate,
  assertJoinDeckRequirements: mocks.joinGate,
  requiresDeclaredDeckForJoin: mocks.requiresDeck,
}));
vi.mock('@/lib/data/tournaments', () => ({
  createTournament: mocks.create,
  joinTournament: mocks.join,
  leaveTournament: mocks.leave,
  readyTournament: vi.fn(),
  getTournamentById: mocks.getTournament,
}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  TournamentApiError: class TournamentApiError extends Error {
    status = 500;
    code?: string;
  },
}));

import { createTableAction, joinTournamentAction } from '@/actions/tournaments';

describe('mazzo opzionale nei tavoli casuali', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: { id: 'user-1', name: 'Duellante', email: 'u@example.test' },
    });
    mocks.declaredGate.mockResolvedValue({ ok: true });
    mocks.joinGate.mockResolvedValue({ ok: true });
    mocks.requiresDeck.mockReturnValue(false);
    mocks.create.mockResolvedValue({ id: 'table-1', webcamSessionId: 'webcam-1' });
    mocks.join.mockResolvedValue({
      tournament: {
        id: 'table-1',
        webcamSessionId: 'webcam-1',
        participants: [],
        maxPlayers: 2,
      },
    });
    mocks.getTournament.mockResolvedValue({
      id: 'table-2',
      format: 'modern',
      mode: 'heads-up',
      status: 'in_registrazione',
      maxPlayers: 2,
      participants: [{ id: 'opponent-1', username: 'Avversario' }],
    });
    mocks.leave.mockResolvedValue(undefined);
  });

  it('crea e occupa il tavolo senza validare un mazzo', async () => {
    await expect(createTableAction('modern', 'heads-up')).resolves.toEqual({
      createdId: 'table-1',
      webcamSessionId: 'webcam-1',
    });
    expect(mocks.declaredGate).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.join).toHaveBeenCalledWith(
      'table-1',
      { id: 'user-1', username: 'Duellante' },
      undefined,
    );
  });

  it('valida prima di creare e associa subito lo snapshot al creatore', async () => {
    await expect(createTableAction('modern', 'heads-up', 'deck-1')).resolves.toEqual({
      createdId: 'table-1',
      webcamSessionId: 'webcam-1',
    });
    expect(mocks.declaredGate).toHaveBeenCalledWith('user-1', {
      deckId: 'deck-1',
      format: 'modern',
      requireScryfall: false,
    });
    expect(mocks.declaredGate.mock.invocationCallOrder[0]).toBeLessThan(
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

  it('fa entrare senza mazzo in un tavolo casuale', async () => {
    mocks.join.mockResolvedValueOnce({
      tournament: {
        id: 'table-2',
        participants: [{ id: 'opponent-1' }, { id: 'user-1' }],
        maxPlayers: 2,
      },
    });

    await expect(joinTournamentAction('table-2')).resolves.toMatchObject({
      createdId: 'table-2',
      tableFull: true,
    });
    expect(mocks.joinGate).not.toHaveBeenCalled();
    expect(mocks.join).toHaveBeenCalledWith(
      'table-2',
      { id: 'user-1', username: 'Duellante' },
      undefined,
    );
  });

  it('mantiene obbligatoria la dichiarazione sui tavoli con verifica', async () => {
    mocks.requiresDeck.mockReturnValue(true);

    await expect(joinTournamentAction('table-2')).resolves.toEqual({
      error: 'Dichiara il mazzo con cui vuoi partecipare.',
    });
    expect(mocks.join).not.toHaveBeenCalled();
  });
});
