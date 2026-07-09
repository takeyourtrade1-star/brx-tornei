import { describe, expect, it } from 'vitest';
import {
  applyTournamentFilters,
  DEFAULT_TOURNAMENT_FILTERS,
  hasActiveTournamentFilters,
  type TournamentFiltersState,
} from '@/lib/tournament-list-filters';
import type { Tournament } from '@/types/tournament';

function tournament(overrides: Partial<Tournament>): Tournament {
  return {
    id: 't1',
    format: 'modern',
    mode: 'heads-up',
    buyIn: 'For Fun',
    bestOf: 'BO3',
    status: 'in_registrazione',
    isPrivate: false,
    participants: [],
    maxParticipants: 2,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as Tournament;
}

const list = [
  tournament({ id: 'a', status: 'in_registrazione', bestOf: 'BO1', isPrivate: false }),
  tournament({ id: 'b', status: 'iniziata', bestOf: 'BO3', isPrivate: true }),
  tournament({ id: 'c', status: 'terminata', bestOf: 'BO5', isPrivate: false }),
];

describe('applyTournamentFilters', () => {
  it('default: nessun filtro attivo, lista intatta', () => {
    expect(applyTournamentFilters(list, DEFAULT_TOURNAMENT_FILTERS)).toHaveLength(3);
    expect(hasActiveTournamentFilters(DEFAULT_TOURNAMENT_FILTERS)).toBe(false);
  });

  it('filtra per stato', () => {
    const filters: TournamentFiltersState = { ...DEFAULT_TOURNAMENT_FILTERS, status: 'iniziata' };
    expect(applyTournamentFilters(list, filters).map((t) => t.id)).toEqual(['b']);
  });

  it('filtra per best of', () => {
    const filters: TournamentFiltersState = { ...DEFAULT_TOURNAMENT_FILTERS, bestOf: 'BO5' };
    expect(applyTournamentFilters(list, filters).map((t) => t.id)).toEqual(['c']);
  });

  it('filtra per visibilità in entrambe le direzioni', () => {
    const pub: TournamentFiltersState = { ...DEFAULT_TOURNAMENT_FILTERS, visibility: 'public' };
    const priv: TournamentFiltersState = { ...DEFAULT_TOURNAMENT_FILTERS, visibility: 'private' };
    expect(applyTournamentFilters(list, pub).map((t) => t.id)).toEqual(['a', 'c']);
    expect(applyTournamentFilters(list, priv).map((t) => t.id)).toEqual(['b']);
  });

  it('i filtri si combinano in AND', () => {
    const filters: TournamentFiltersState = {
      ...DEFAULT_TOURNAMENT_FILTERS,
      status: 'in_registrazione',
      visibility: 'private',
    };
    expect(applyTournamentFilters(list, filters)).toHaveLength(0);
    expect(hasActiveTournamentFilters(filters)).toBe(true);
  });
});
