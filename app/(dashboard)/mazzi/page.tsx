import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MazziWorkspace } from '@/components/feature/decks/mazzi-workspace';
import { getSession } from '@/lib/auth/session';
import { listDecks } from '@/lib/data/decks';

export const metadata: Metadata = { title: 'Crea mazzo' };

export default async function MazziPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const decks = await listDecks(session.user.id);

  return <MazziWorkspace initialDecks={decks} user={session.user} />;
}
