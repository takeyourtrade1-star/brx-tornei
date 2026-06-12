import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTournaments } from '@/lib/data/tournaments';
import { parseSelection } from '@/lib/validations/selection';
import { getFormat, getMode } from '@/lib/data/catalog';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { TournamentsTable } from '@/components/feature/tornei/tournaments-table';
import { CreateTournamentButton } from '@/components/feature/tornei/create-tournament-button';

export const metadata: Metadata = { title: 'Tornei' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard Tornei — browsing pubblico; azioni (crea/partecipa) richiedono login via popup.
 */
export default async function TorneiPage({ searchParams }: PageProps) {
  const selection = parseSelection(await searchParams);
  if (!selection) redirect('/hub');

  const session = await getSession();
  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const tournaments = await getTournaments(selection);

  return (
    <>
      {session ? (
        <DashboardHeader
          user={session.user}
          formatName={format.name}
          modeName={mode.name}
          selection={selection}
          activeNav="tornei"
        />
      ) : (
        <SiteHeader
          selection={selection}
          formatName={format.name}
          modeName={mode.name}
        />
      )}

      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:gap-8 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0 space-y-1.5">
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-white drop-shadow sm:text-3xl">
              Tornei <span className="text-primary">{format.name}</span>
            </h1>
            <p className="text-sm text-white/60">
              {mode.name} · Buy-In <span className="font-bold text-marquee">For Fun</span>
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              {tournaments.length}{' '}
              {tournaments.length === 1 ? 'torneo disponibile' : 'tornei disponibili'}
            </p>
          </div>
          <CreateTournamentButton
            selection={selection}
            isLoggedIn={!!session}
            className="shrink-0 sm:min-w-[11rem]"
          />
        </div>

        <TournamentsTable tournaments={tournaments} isLoggedIn={!!session} />
      </main>
    </>
  );
}
