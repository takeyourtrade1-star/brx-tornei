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

describe('dichiarazione mazzo nei tavoli', () => {
  it('consente di entrare senza mazzo e valida comunque quelli selezionati', () => {
    expect(joinTournamentSchema.safeParse({ tournamentId: 'table-1' }).success).toBe(true);
    expect(joinTournamentSchema.safeParse({ tournamentId: 'table-1', deckId: '  ' }).success)
      .toBe(true);
    expect(joinTournamentSchema.parse({ tournamentId: 'table-1', deckId: 'deck-1' }))
      .toEqual({ tournamentId: 'table-1', deckId: 'deck-1' });
    expect(createTableSchema.safeParse({
      format: 'modern',
      mode: 'heads-up',
      bestOf: 'BO3',
      isPrivate: false,
      withFriend: true,
      isTournament: false,
      enableScryfallCheck: false,
      enablePhysicalVerification: false,
    }).success).toBe(true);
  });

  it('conserva i flag autorevoli e richiede il mazzo solo per i tornei verificati', () => {
    const casualTournament = mapTournamentFromApi(rawTournament);
    expect(requiresDeclaredDeckForJoin(casualTournament!)).toBe(false);

    const officialTournament = mapTournamentFromApi({
      ...rawTournament,
      is_tournament: true,
      enable_scryfall_check: true,
      enable_physical_verification: false,
    });
    expect(officialTournament).toMatchObject({
      isTournament: true,
      enableScryfallCheck: true,
      enablePhysicalVerification: false,
    });
    expect(requiresDeclaredDeckForJoin(officialTournament!)).toBe(true);
  });
});
