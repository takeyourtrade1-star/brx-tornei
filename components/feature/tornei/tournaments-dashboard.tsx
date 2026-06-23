'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { Tournament } from '@/types/tournament';
import { CreateTournamentButton } from './create-tournament-button';
import {
  applyTournamentFilters,
  DEFAULT_TOURNAMENT_FILTERS,
  hasActiveTournamentFilters,
  type TournamentFiltersState,
} from './tournament-filters';
import { TournamentsStickyToolbar } from './tournaments-sticky-toolbar';
import { TournamentsTable } from './tournaments-table';

interface TournamentsDashboardProps {
  tournaments: Tournament[];
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
}

export function TournamentsDashboard({
  tournaments,
  selection,
  formatId,
  formatName,
  modeName,
}: TournamentsDashboardProps) {
  const [filters, setFilters] = useState<TournamentFiltersState>(DEFAULT_TOURNAMENT_FILTERS);

  useEffect(() => {
    setFilters(DEFAULT_TOURNAMENT_FILTERS);
  }, [formatId, selection.mode]);

  const filteredTournaments = useMemo(
    () => applyTournamentFilters(tournaments, filters),
    [tournaments, filters],
  );

  const filtersActive = hasActiveTournamentFilters(filters);

  return (
    <div className="flex flex-col gap-6">
      <TournamentsStickyToolbar
        formatId={formatId}
        modeId={selection.mode as ModeId}
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredTournaments.length}
        totalCount={tournaments.length}
      />

      <section className="flex scroll-mt-52 flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-sans text-sm font-semibold text-white/90 sm:text-base">
            Tornei <span className="text-primary">{formatName}</span>
            <span className="mx-1.5 text-white/35" aria-hidden>
              ·
            </span>
            <span className="font-medium text-white/60">{modeName}</span>
          </h2>
          <CreateTournamentButton selection={selection} />
        </div>

        <TournamentsTable
          tournaments={filteredTournaments}
          formatName={formatName}
          modeName={modeName}
          filtersActive={filtersActive}
        />
      </section>
    </div>
  );
}
