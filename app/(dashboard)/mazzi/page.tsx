import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getDecks } from '@/lib/data/decks';
import { getFormat, getMode } from '@/lib/data/catalog';
import { parseSelectionOrDefault } from '@/lib/validations/selection';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DecksGrid } from '@/components/feature/mazzi/decks-grid';
import { CreateDeckButton } from '@/components/feature/mazzi/create-deck-button';

export const metadata: Metadata = { title: 'I miei mazzi' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Lista mazzi dell'utente — server-side con mock data. */
export default async function MazziPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const selection = parseSelectionOrDefault(await searchParams);
  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const decks = await getDecks(session.user.id);

  return (
    <>
      <DashboardHeader
        user={session.user}
        formatName={format.name}
        modeName={mode.name}
        selection={selection}
        activeNav="mazzi"
      />

      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow">
              I miei <span className="text-primary">mazzi</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Gestisci i listini per i tuoi formati preferiti
            </p>
          </div>
          <CreateDeckButton selection={selection} />
        </div>

        <DecksGrid decks={decks} selection={selection} />
      </main>
    </>
  );
}
