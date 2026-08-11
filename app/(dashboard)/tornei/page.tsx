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
  const gamertag = await requireGamertag(
    `/tornei?format=${selection.format}&mode=${selection.mode}`,
  );

  const formatName = selection.format === 'all' ? 'Tutti i formati' : getFormat(selection.format)!.name;
  const modeName = getMode(selection.mode)!.name;
  // Fetch aggregato (tutti i formati): i MIEI tavoli devono restare visibili
  // anche quando sono in un altro formato, altrimenti il backend rifiuterebbe
  // di sedermi altrove (ALREADY_SEATED) senza che io possa abbandonarli.
  const [tournaments, reputation] = await Promise.all([
    getTournaments({ format: 'all', mode: selection.mode }),
    fetchMyReputation().catch(() => null),
  ]);

  return (
    <LobbyPage
      tournaments={tournaments}
      user={session.user}
      gamertag={gamertag}
      selection={selection}
      formatId={selection.format}
      formatName={formatName}
      modeName={modeName}
      reputation={reputation}
    />
  );
}
