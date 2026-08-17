import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MazziWorkspace } from '@/components/feature/decks/mazzi-workspace';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { listDecks } from '@/lib/data/decks';
import { getDefaultPlaymatId } from '@/lib/playmat-preference';

export const metadata: Metadata = { title: 'Crea mazzo' };

export default async function MazziPage() {
  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag('/mazzi');

  const [decks, defaultPlaymatId, reputation] = await Promise.all([
    listDecks(session.user.id),
    getDefaultPlaymatId(),
    fetchMyReputation().catch(() => null),
  ]);

  return (
    <MazziWorkspace
      initialDecks={decks}
      user={session.user}
      gamertag={gamertag}
      defaultPlaymatId={defaultPlaymatId}
      reputation={reputation}
    />
  );
}
