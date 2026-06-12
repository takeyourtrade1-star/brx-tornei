import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getMatchById } from '@/lib/data/match-detail';
import { MatchManagementDashboard } from '@/components/feature/partite/management/match-management-dashboard';

export const metadata: Metadata = { title: 'Gestione match' };

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/** Centro gestione match — dashboard controllo partita. */
export default async function MatchManagementPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { matchId } = await params;
  const match = await getMatchById(session.user.id, matchId);
  if (!match) notFound();

  return (
    <main className="min-h-screen bg-gradient-card pt-6 sm:pt-8">
      <MatchManagementDashboard match={match} />
    </main>
  );
}
