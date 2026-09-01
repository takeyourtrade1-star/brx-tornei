import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('react', () => ({ cache: (operation: unknown) => operation }));

import { mapTournamentFromApi } from '@/lib/data/tournament-mapper';
import { requiresDeclaredDeckForJoin } from '@/lib/join-deck-gate';
import { createTableSchema, joinTournamentSchema } from '@/lib/validations/tournament';

const rawTournament = {
  id: 'table-1',
  format: 'modern',
  mode: 'heads-up',
  created_at: '2026-08-31T10:00:00Z',
  participants: [],
};

describe('dichiarazione mazzo prima della seduta', () => {
  it('rifiuta identificatori assenti o vuoti anche nei percorsi diretti', () => {
    expect(joinTournamentSchema.safeParse({ tournamentId: 'table-1' }).success).toBe(false);
    expect(joinTournamentSchema.safeParse({ tournamentId: 'table-1', deckId: '  ' }).success)
      .toBe(false);
    expect(joinTournamentSchema.parse({ tournamentId: 'table-1', deckId: 'deck-1' }))
      .toEqual({ tournamentId: 'table-1', deckId: 'deck-1' });
    expect(createTableSchema.safeParse({
      format: 'modern',
      mode: 'ranked',
      bestOf: 'BO3',
      withFriend: true,
    }).success).toBe(false);
  });

  it('conserva i flag autorevoli snake_case e richiede comunque la dichiarazione', () => {
    const tournament = mapTournamentFromApi({
      ...rawTournament,
      is_tournament: true,
      enable_scryfall_check: true,
      enable_physical_verification: false,
    });
    expect(tournament).toMatchObject({
      isTournament: true,
      enableScryfallCheck: true,
      enablePhysicalVerification: false,
    });
    expect(requiresDeclaredDeckForJoin(tournament!)).toBe(true);
  });
});
