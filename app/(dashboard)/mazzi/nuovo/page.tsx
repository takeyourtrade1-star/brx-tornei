import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getCatalogCards } from '@/lib/data/cards';
import { FORMATS, getFormat, getMode } from '@/lib/data/catalog';
import { selectionQuery, parseSelectionOrDefault } from '@/lib/validations/selection';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { CreateDeckBuilder } from '@/components/feature/mazzi/create-deck/create-deck-builder';

export const metadata: Metadata = { title: 'Crea mazzo' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Builder creazione mazzo — pagina RSC con unico client component foglia (builder).
 * Prefill opzionale da ?format=..&mode=..
 */
export default async function NuovoMazzoPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect('/login');

  const selection = parseSelectionOrDefault(await searchParams);
  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const catalogCards = await getCatalogCards();

  return (
    <>
      <DashboardHeader
        user={session.user}
        formatName={format.name}
        modeName={mode.name}
        selection={selection}
        activeNav="mazzi"
      />

      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 pb-24 lg:pb-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/mazzi${selectionQuery(selection)}`}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai mazzi
          </Link>

          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow">
              Crea <span className="text-primary">mazzo</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Compila il listino in quattro passaggi: info, main deck, sideboard e conferma.
            </p>
          </div>
        </div>

        <CreateDeckBuilder
          initialFormat={selection.format ?? FORMATS[0]!.id}
          catalogCards={catalogCards}
        />
      </main>
    </>
  );
}
