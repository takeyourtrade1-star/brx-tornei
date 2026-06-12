import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getMatchById } from '@/lib/data/match-detail';
import { MatchTableView } from '@/components/feature/partite/table/match-table-view';

export const metadata: Metadata = { title: 'Tavolo partita' };

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/** Schermata tavolo — layout videochiamata con pannello punteggio. */
export default async function MatchTablePage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { matchId } = await params;
  const match = await getMatchById(session.user.id, matchId);
  if (!match) notFound();

  return (
    <main className="min-h-screen bg-gradient-card pt-4 sm:pt-6">
      <MatchTableView match={match} />
    </main>
  );
}
