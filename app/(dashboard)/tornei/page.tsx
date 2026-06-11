import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTournaments } from '@/lib/data/tournaments';
import { parseSelection } from '@/lib/validations/selection';
import { getFormat, getMode } from '@/lib/data/catalog';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { TournamentsTable } from '@/components/feature/tornei/tournaments-table';
import { CreateTournamentButton } from '@/components/feature/tornei/create-tournament-button';

export const metadata: Metadata = { title: 'Tornei' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard Tornei (main view) — tutto server-side:
 * sessione dal cookie, selezione dai searchParams, dati dal data layer.
 */
export default async function TorneiPage({ searchParams }: PageProps) {
  const selection = parseSelection(await searchParams);
  if (!selection) redirect('/hub'); // selezione assente/invalida → hub

  const session = await getSession();
  if (!session) redirect('/login'); // token presente ma non valido → login

  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const tournaments = await getTournaments(selection);

  return (
    <>
      <DashboardHeader
        user={session.user}
        formatId={format.id}
        formatName={format.name}
        modeName={mode.name}
      />

      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6">
        {/* Barra titolo + azione principale */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl uppercase tracking-wide text-white drop-shadow">
              Tornei <span className="text-primary">{format.name}</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              {mode.name} · Buy-In <span className="font-bold text-marquee">For Fun</span>
            </p>
          </div>
          <CreateTournamentButton selection={selection} />
        </div>

        <TournamentsTable tournaments={tournaments} />
      </main>
    </>
  );
}
