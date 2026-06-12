import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { FORMATS, MODES, getFormat, getMode } from '@/lib/data/catalog';
import { selectionSchema } from '@/lib/validations/selection';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { CreateTournamentWizard } from '@/components/feature/tornei/create-tournament/create-tournament-wizard';

export const metadata: Metadata = { title: 'Crea torneo' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Wizard creazione torneo — pagina RSC con unico client component foglia (wizard).
 * Prefill opzionale da ?format=..&mode=.. (es. dalla dashboard o dall'hub).
 */
export default async function NuovoTorneoPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getSession();
  if (!session) redirect('/login');

  const formatParam = typeof params.format === 'string' ? params.format : FORMATS[0]!.id;
  const modeParam = typeof params.mode === 'string' ? params.mode : 'heads-up';

  const parsed = selectionSchema.safeParse({ format: formatParam, mode: modeParam });
  const selection = parsed.success
    ? parsed.data
    : { format: FORMATS[0]!.id, mode: 'heads-up' as const };

  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;

  return (
    <>
      <DashboardHeader
        user={session.user}
        formatName={format.name}
        modeName={mode.name}
        selection={selection}
        activeNav="tornei"
      />

      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href={`/tornei?format=${selection.format}&mode=${selection.mode}`}
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai tornei
          </Link>

          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide text-white drop-shadow">
              Crea <span className="text-primary">torneo</span>
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Configura il tuo torneo in pochi passaggi. Buy-in For Fun, regole su misura.
            </p>
          </div>
        </div>

        <CreateTournamentWizard
          initialFormat={selection.format}
          initialMode={selection.mode}
        />
      </main>
    </>
  );
}
