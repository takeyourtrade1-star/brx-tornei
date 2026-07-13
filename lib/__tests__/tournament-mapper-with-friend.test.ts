import { describe, expect, it } from 'vitest';
import { mapTournamentFromApi } from '@/lib/data/tournament-mapper';

const baseTournament = {
  id: 'tournament-1',
  format: 'modern',
  mode: 'heads-up',
  created_at: '2026-07-13T08:00:00Z',
  participants: [],
};

describe('mapTournamentFromApi with_friend', () => {
  it('propaga il consenso P2P dal backend', () => {
    expect(mapTournamentFromApi({ ...baseTournament, with_friend: true })?.withFriend).toBe(true);
  });

  it('usa la modalità protetta per default', () => {
    expect(mapTournamentFromApi(baseTournament)?.withFriend).toBe(false);
  });
});
