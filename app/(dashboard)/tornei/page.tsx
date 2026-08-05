import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { getTournaments } from '@/lib/data/tournaments';
import { parseSelection } from '@/lib/validations/selection';
import { getFormat, getMode } from '@/lib/data/catalog';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { LobbyPage } from '@/components/feature/tornei/lobby/lobby-page';

export const metadata: Metadata = { title: 'Tornei' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard Tornei — lobby a tavoli. Sessione dal cookie, selezione dai
 * searchParams, tavoli dal Tournament Service (nessun mock).
 */
export default async function TorneiPage({ searchParams }: PageProps) {
  const selection = parseSelection(await searchParams);
  if (!selection) redirect(DEFAULT_TOURNAMENTS_PATH);

  const session = await getSession();
  if (!session) redirect('/login');
  await requireGamertag(`/tornei?format=${selection.format}&mode=${selection.mode}`);

  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const [tournaments, reputation] = await Promise.all([
    getTournaments(selection),
    // Nice-to-have: un errore qui non deve bloccare la lobby.
    fetchMyReputation().catch(() => null),
  ]);

  return (
    <LobbyPage
      tournaments={tournaments}
      user={session.user}
      selection={selection}
      formatId={format.id}
      formatName={format.name}
      modeName={mode.name}
      reputation={reputation}
    />
  );
}
