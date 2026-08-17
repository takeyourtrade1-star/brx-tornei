import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tournamentFetch: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/data/tournament-api-client', () => ({
  tournamentFetch: mocks.tournamentFetch,
  extractApiError: vi.fn(),
  TournamentApiError: class TournamentApiError extends Error {},
}));

import { fetchMyReputation } from '@/lib/data/player-api-client';

function reputationBody(positiveFeedbackNotice: unknown, negativeFeedbackNotice: unknown) {
  return {
    data: {
      played: 1,
      wins: 1,
      losses: 0,
      abandoned: 0,
      disputed: 0,
      recent: [],
      positive_feedback_notice: positiveFeedbackNotice,
      negative_feedback_notice: negativeFeedbackNotice,
    },
  };
}

describe('feedback notice mapping', () => {
  beforeEach(() => mocks.tournamentFetch.mockReset());

  it('mappa i timestamp validi restituiti dal backend', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: reputationBody(
        { received_at: '2026-08-17T09:00:00+00:00' },
        { received_at: '2026-08-17T10:00:00+00:00' },
      ),
    });

    const reputation = await fetchMyReputation();

    expect(reputation.positiveFeedbackNotice).toEqual({
      receivedAt: '2026-08-17T09:00:00+00:00',
    });
    expect(reputation.negativeFeedbackNotice).toEqual({
      receivedAt: '2026-08-17T10:00:00+00:00',
    });
  });

  it('ignora in modo sicuro gli avvisi malformati', async () => {
    mocks.tournamentFetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: reputationBody({ received_at: 123 }, { received_at: 'non-una-data' }),
    });

    const reputation = await fetchMyReputation();

    expect(reputation.positiveFeedbackNotice).toBeNull();
    expect(reputation.negativeFeedbackNotice).toBeNull();
  });
});
