import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { PartiteHero } from '@/components/feature/tornei/partite/partite-hero';
import { PartiteStatsGrid } from '@/components/feature/tornei/partite/partite-stats-grid';
import { PartiteBattleLog } from '@/components/feature/tornei/partite/partite-battle-log';
import { PartiteMedals } from '@/components/feature/tornei/partite/partite-medals';
import { PartiteInGameRatings } from '@/components/feature/tornei/partite/partite-in-game-ratings';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputationPage } from '@/lib/data/player-api-client';
import { fetchMyMatchFeedback } from '@/lib/data/match-feedback';
import { fetchNotificationSnapshot } from '@/lib/data/notifications';

export const metadata: Metadata = { title: 'Le mie partite' };

/** Storico completo delle partite: arena del duellante con stats, cronache e medaglie. */
export default async function PartitePage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag('/partite');

  const [reputation, matchFeedback, notifications] = await Promise.all([
    fetchMyReputationPage().catch(() => null),
    fetchMyMatchFeedback().catch(() => null),
    fetchNotificationSnapshot(),
  ]);

  return (
    <div className="relative min-h-screen">
      <DashboardHeader
        user={session.user}
        displayName={gamertag}
        reputation={reputation}
        initialNotifications={notifications}
      />

      <main className="mx-auto w-full max-w-content px-4 py-5 sm:px-6 sm:py-6">
        <h1 className="sr-only">Le mie partite</h1>

        <div className="mb-4">
          <Link href="/tornei" className="arena-back">
            <ArrowLeft className="h-3.5 w-3.5" />
            Torna ai tornei
          </Link>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          <PartiteHero gamertag={gamertag} reputation={reputation} />
          <PartiteStatsGrid reputation={reputation} />
          <PartiteBattleLog reputation={reputation} />
          <PartiteMedals reputation={reputation} />
          <PartiteInGameRatings feedback={matchFeedback} />
        </div>
      </main>
    </div>
  );
}
