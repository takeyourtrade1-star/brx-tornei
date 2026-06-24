import type { Tournament } from '@/types/tournament';
import { TournamentEmptyState } from './tournament-empty-state';
import { TournamentMobileCard } from './tournament-mobile-card';
import { TournamentDesktopRow } from './tournament-desktop-row';

interface TournamentsTableProps {
  tournaments: Tournament[];
  formatName?: string;
  modeName?: string;
  filtersActive?: boolean;
}

/**
 * Tabella tornei: Buy-In · Best Of · Stato · Registrati · Partecipanti.
 */
export function TournamentsTable({
  tournaments,
  formatName,
  modeName,
  filtersActive = false,
}: TournamentsTableProps) {
  if (tournaments.length === 0) {
    const contextLabel =
      formatName && modeName ? `${formatName} · ${modeName}` : 'questa selezione';

    return <TournamentEmptyState contextLabel={contextLabel} filtersActive={filtersActive} />;
  }

  return (
    <>
      {/* Mobile: lista card */}
      <div className="flex flex-col gap-3 md:hidden">
        {tournaments.map((t) => (
          <TournamentMobileCard key={t.id} tournament={t} />
        ))}
      </div>

      {/* Desktop: tabella */}
      <div className="simple-panel hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/[0.06] font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-white/50">
              <th scope="col" className="px-4 py-3.5">Buy-In</th>
              <th scope="col" className="px-4 py-3.5">Best Of</th>
              <th scope="col" className="px-4 py-3.5">Stato</th>
              <th scope="col" className="px-4 py-3.5">Registrati</th>
              <th scope="col" className="px-4 py-3.5">Partecipanti</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <TournamentDesktopRow key={t.id} tournament={t} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
