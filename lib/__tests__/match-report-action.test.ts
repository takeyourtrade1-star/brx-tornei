import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  submitMatchReport: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/data/match-report', () => ({ submitMatchReport: mocks.submitMatchReport }));
vi.mock('@/lib/data/tournament-api-client', () => ({
  TournamentApiError: class TournamentApiError extends Error {},
}));

import { submitMatchReportAction } from '@/actions/reports';

describe('submitMatchReportAction', () => {
  beforeEach(() => {
    mocks.getSession.mockReset();
    mocks.submitMatchReport.mockReset();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.submitMatchReport.mockResolvedValue({ status: 'ok' });
  });

  it('accetta il testo passato dal modal e invia la segnalazione', async () => {
    const result = await submitMatchReportAction(
      'match-1',
      'L’avversario ha usato un linguaggio offensivo.',
    );

    expect(result).toEqual({ status: 'ok' });
    expect(mocks.submitMatchReport).toHaveBeenCalledWith(
      'match-1',
      'L’avversario ha usato un linguaggio offensivo.',
    );
  });

  it('rifiuta un testo troppo corto senza chiamare il backend', async () => {
    const result = await submitMatchReportAction('match-1', 'no');

    expect(result.error).toBe('Descrivi il problema con almeno 5 caratteri.');
    expect(mocks.submitMatchReport).not.toHaveBeenCalled();
  });
});
