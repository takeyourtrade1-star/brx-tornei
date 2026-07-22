import { describe, expect, it } from 'vitest';
import { mapTournamentFromApi } from '@/lib/data/tournament-mapper';

const base = {
  id: 't-1',
  format: 'modern',
  mode: 'heads-up',
  created_at: '2026-07-20T10:00:00+00:00',
  participants: [],
};

describe('tournament mapper activity timestamp', () => {
  it('maps the authoritative updated_at timestamp', () => {
    const tournament = mapTournamentFromApi({
      ...base,
      updated_at: '2026-07-22T09:59:00+00:00',
    });

    expect(tournament?.updatedAt).toBe('2026-07-22T09:59:00+00:00');
  });

  it('falls back to created_at during a rolling backend deploy', () => {
    const tournament = mapTournamentFromApi(base);

    expect(tournament?.updatedAt).toBe(base.created_at);
  });
});
