import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTournaments } from '@/lib/data/tournaments';
import { getMyInventory } from '@/lib/data/inventory';
import { parseSelection } from '@/lib/validations/selection';
import { getFormat, getMode } from '@/lib/data/catalog';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { TournamentGameView } from '@/components/feature/tornei/tournament-game-view';

export const metadata: Metadata = { title: 'Tornei' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard Tornei (main view) — tutto server-side:
 * sessione dal cookie, selezione dai searchParams, dati dal data layer.
 */
export default async function TorneiPage({ searchParams }: PageProps) {
  const selection = parseSelection(await searchParams);
  if (!selection) redirect(DEFAULT_TOURNAMENTS_PATH);

  const session = await getSession();
  if (!session) redirect('/login');

  const format = getFormat(selection.format)!;
  const mode = getMode(selection.mode)!;
  const [tournaments, inventory] = await Promise.all([
    getTournaments(selection),
    getMyInventory(session.user.id),
  ]);

  return (
    <TournamentGameView
      tournaments={tournaments}
      inventory={inventory}
      selection={selection}
      user={session.user}
      formatId={format.id}
      formatName={format.name}
      modeName={mode.name}
    />
  );
}
