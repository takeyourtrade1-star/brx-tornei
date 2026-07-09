import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getTournamentById } from '@/lib/data/tournaments';
import { parseLiveViewSearch } from '@/lib/validations/live';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MatchLiveView } from '@/components/feature/tornei/match/match-live-view';

export const metadata: Metadata = { title: 'Partita live' };

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TournamentLivePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect('/login');

  const tournament = await getTournamentById(id);
  if (!tournament) notFound();

  const { role: requestedRole } = parseLiveViewSearch(await searchParams);
  const isParticipant = tournament.participants.some((p) => p.id === session.user.id);
  const role = isParticipant ? 'player' : requestedRole === 'observer' ? 'observer' : 'observer';

  // Ruolo P2P deterministico: con l'OR su createdById/participants[0] i due
  // client potevano risultare entrambi host (offer vs offer → nessun video).
  // Con due giocatori l'host è sempre quello con id minore: regola identica
  // su entrambi i client, qualunque cosa ritorni il backend.
  const playerIds = tournament.participants.map((p) => p.id).sort();
  const isHost =
    playerIds.length >= 2
      ? playerIds[0] === session.user.id
      : tournament.createdById === session.user.id ||
        tournament.participants[0]?.id === session.user.id;

  return (
    <>
      <DashboardHeader user={session.user} />
      <MatchLiveView
        tournament={tournament}
        role={role}
        me={session.user.name ?? session.user.email}
        userId={session.user.id}
        accessToken={session.accessToken}
        isHost={isHost}
      />
    </>
  );
}
