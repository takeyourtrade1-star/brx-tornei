import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MazziWorkspace } from '@/components/feature/decks/mazzi-workspace';
import { getSession } from '@/lib/auth/session';
import { listDecks } from '@/lib/data/decks';
import { getDefaultPlaymatId } from '@/lib/playmat-preference';

export const metadata: Metadata = { title: 'Crea mazzo' };

export default async function MazziPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const decks = await listDecks(session.user.id);
  const defaultPlaymatId = await getDefaultPlaymatId();

  return <MazziWorkspace initialDecks={decks} user={session.user} defaultPlaymatId={defaultPlaymatId} />;
}
