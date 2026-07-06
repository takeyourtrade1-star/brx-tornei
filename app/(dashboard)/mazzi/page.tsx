import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { MazziWorkspace } from '@/components/feature/decks/mazzi-workspace';
import { getSession } from '@/lib/auth/session';
import { listDecks } from '@/lib/data/decks';
import { getMyInventory } from '@/lib/data/inventory';

export const metadata: Metadata = { title: 'Crea mazzo' };

export default async function MazziPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const [inventory, decks] = await Promise.all([
    getMyInventory(session.user.id),
    listDecks(session.user.id),
  ]);

  return (
    <MazziWorkspace
      initialInventory={inventory}
      initialDecks={decks}
      user={session.user}
    />
  );
}
