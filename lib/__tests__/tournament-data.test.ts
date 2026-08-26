import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchTournaments: vi.fn(),
  postJoinTournament: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  fetchTournamentById: vi.fn(),
  fetchTournaments: mocks.fetchTournaments,
  isTournamentsApiEnabled: vi.fn(),
  postJoinTournament: mocks.postJoinTournament,
  postLeaveTournament: vi.fn(),
  postReadyTournament: vi.fn(),
  postCreateTournament: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import { getTournaments, joinTournament } from '@/lib/data/tournaments';

describe('getTournaments', () => {
  beforeEach(() => {
    mocks.fetchTournaments.mockReset();
    mocks.fetchTournaments.mockResolvedValue([]);
    mocks.postJoinTournament.mockReset();
  });

  it('usa una sola lettura backend per Tutti i formati', async () => {
    const selection = { format: 'all', mode: 'heads-up' } as const;

    await getTournaments(selection);

    expect(mocks.fetchTournaments).toHaveBeenCalledOnce();
    expect(mocks.fetchTournaments).toHaveBeenCalledWith(selection);
  });

  it('inoltra al backend il mazzo scelto per la seduta', async () => {
    mocks.postJoinTournament.mockResolvedValue({ tournament: {} });

    await joinTournament('table-1', { id: 'player-1', username: 'Nick' }, 'deck-1');

    expect(mocks.postJoinTournament).toHaveBeenCalledWith('table-1', 'deck-1');
  });
});
