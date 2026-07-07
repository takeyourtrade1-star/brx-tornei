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
  mobile?: boolean;
  onTournamentCreated?: (result: { createdId: string; webcamSessionId?: string }) => void;
  onJoinTournament?: (id: string) => void;
  onObserveTournament?: (id: string) => void;
}

export function TournamentsDashboard({
  tournaments,
  selection,
  formatId,
  formatName,
  modeName,
  mobile = false,
  onTournamentCreated,
  onJoinTournament,
  onObserveTournament,
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
    <div className="flex flex-col gap-5">
      <TournamentsStickyToolbar
        formatId={formatId}
        modeId={selection.mode as ModeId}
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={filteredTournaments.length}
        totalCount={tournaments.length}
        mobile={mobile}
      />

      <section className="flex scroll-mt-52 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-sans text-base font-bold uppercase tracking-widest text-slate-500 sm:text-lg">
            Tornei <span className="text-slate-900">{formatName}</span>
            <span className="mx-2 text-slate-400" aria-hidden>
              ·
            </span>
            <span className="text-slate-600">{modeName}</span>
          </h2>
          <CreateTournamentButton
            selection={selection}
            formatName={formatName}
            modeName={modeName}
            onCreated={onTournamentCreated}
          />
        </div>

        <TournamentsTable
          tournaments={filteredTournaments}
          formatName={formatName}
          modeName={modeName}
          filtersActive={filtersActive}
          onJoinTournament={onJoinTournament}
          onObserveTournament={onObserveTournament}
        />
      </section>
    </div>
  );
}
