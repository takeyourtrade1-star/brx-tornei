import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  fetchTournaments: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  fetchTournamentById: vi.fn(),
  fetchTournaments: mocks.fetchTournaments,
  isTournamentsApiEnabled: vi.fn(),
  postJoinTournament: vi.fn(),
  postLeaveTournament: vi.fn(),
  postReadyTournament: vi.fn(),
  postCreateTournament: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import { getTournaments } from '@/lib/data/tournaments';

describe('getTournaments', () => {
  beforeEach(() => {
    mocks.fetchTournaments.mockReset();
    mocks.fetchTournaments.mockResolvedValue([]);
  });

  it('usa una sola lettura backend per Tutti i formati', async () => {
    const selection = { format: 'all', mode: 'heads-up' } as const;

    await getTournaments(selection);

    expect(mocks.fetchTournaments).toHaveBeenCalledOnce();
    expect(mocks.fetchTournaments).toHaveBeenCalledWith(selection);
  });
});
