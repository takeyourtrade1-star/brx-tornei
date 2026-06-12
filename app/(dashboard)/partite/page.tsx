import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getFormat, getMode } from '@/lib/data/catalog';
import { getActiveMatchesGrouped, getMatchCounts, getMatches } from '@/lib/data/matches';
import { parseMatchTab } from '@/lib/validations/match-filters';
import { parseSelectionOrDefault } from '@/lib/validations/selection';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { ActiveMatchesGroups } from '@/components/feature/partite/active-matches-groups';
import { DemoDurationBanner } from '@/components/feature/partite/demo-duration-banner';
import { MatchesList } from '@/components/feature/partite/matches-list';
import { MatchesTabs } from '@/components/feature/partite/matches-tabs';

export const metadata: Metadata = { title: 'Le mie partite' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Lista partite dell'utente con filtri tab — server-side con mock data. */
export default async function PartitePage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const selection = parseSelectionOrDefault(params);
  const tab = parseMatchTab(params);
  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;

  const counts = await getMatchCounts(session.user.id);

  const content =
    tab === 'attive' ? (
      <ActiveMatchesGroups groups={await getActiveMatchesGrouped(session.user.id)} />
    ) : (
      <MatchesList matches={await getMatches(session.user.id, tab)} />
    );

  return (
    <>
      <DashboardHeader
        user={session.user}
        formatName={format.name}
        modeName={mode.name}
        selection={selection}
        activeNav="partite"
      />

      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6">
        <div>
          <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow">
            Le mie <span className="text-primary">partite</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Storico e partite in corso nei tornei Ebartex
          </p>
        </div>

        <DemoDurationBanner />
        <MatchesTabs currentTab={tab} selection={selection} counts={counts} />
        {content}
      </main>
    </>
  );
}
