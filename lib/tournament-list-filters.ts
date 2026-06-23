import type { BestOf, Tournament, TournamentStatus } from '@/types/tournament';
import type { BuyIn } from '@/lib/data/buy-in';

export interface TournamentFiltersState {
  status: 'all' | TournamentStatus;
  bestOf: 'all' | BestOf;
  visibility: 'all' | 'public' | 'private';
  buyIn: 'all' | BuyIn;
}

export const DEFAULT_TOURNAMENT_FILTERS: TournamentFiltersState = {
  status: 'all',
  bestOf: 'all',
  visibility: 'all',
  buyIn: 'all',
};

/** Applica i filtri client-side sull'array tornei già filtrato per formato/modalità. */
export function applyTournamentFilters(
  tournaments: Tournament[],
  filters: TournamentFiltersState,
): Tournament[] {
  return tournaments.filter((t) => {
    if (filters.status !== 'all' && t.status !== filters.status) return false;
    if (filters.bestOf !== 'all' && t.bestOf !== filters.bestOf) return false;
    if (filters.buyIn !== 'all' && t.buyIn !== filters.buyIn) return false;
    if (filters.visibility === 'public' && t.isPrivate) return false;
    if (filters.visibility === 'private' && !t.isPrivate) return false;
    return true;
  });
}

export function hasActiveTournamentFilters(filters: TournamentFiltersState): boolean {
  return (
    filters.status !== 'all' ||
    filters.bestOf !== 'all' ||
    filters.visibility !== 'all' ||
    filters.buyIn !== 'all'
  );
}
