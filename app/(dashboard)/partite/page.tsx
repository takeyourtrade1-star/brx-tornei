import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MatchHistory } from '@/components/feature/tornei/lobby/match-history';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputationPage } from '@/lib/data/player-api-client';

export const metadata: Metadata = { title: 'Le mie partite' };

/** Storico completo delle partite: contatori + ledger match_results. */
export default async function PartitePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag('/partite');

  const reputation = await fetchMyReputationPage().catch(() => null);

  return (
    <div className="min-h-screen">
      <DashboardHeader user={session.user} displayName={gamertag} reputation={reputation} />
      <main className="mx-auto w-full max-w-content px-4 py-6 sm:px-6">
        <header className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            Storico
          </p>
          <h1 className="mt-1 font-sans text-2xl font-black tracking-tight text-header-bg sm:text-3xl">
            Le mie partite
          </h1>
          <p className="mt-1 text-sm font-semibold text-header-bg/55">
            Vinte, perse, abbandonate e contestate: il tuo ledger completo.
          </p>
        </header>

        <MatchHistory reputation={reputation} />
      </main>
    </div>
  );
}
