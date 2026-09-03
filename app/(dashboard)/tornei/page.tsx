import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { requireGamertag } from '@/lib/auth/require-gamertag';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { getTournaments } from '@/lib/data/tournaments';
import { parseLobbyFocus, parseSelection } from '@/lib/validations/selection';
import { parseFriendInviteGamertag } from '@/lib/friend-invite';
import { getFormat, getMode } from '@/lib/data/catalog';
import { fetchNotificationSnapshot } from '@/lib/data/notifications';
import { fetchFriendsList } from '@/lib/data/social-api-client';
import { DEFAULT_TOURNAMENTS_PATH } from '@/lib/constants/tournament-defaults';
import { LobbyPage } from '@/components/feature/tornei/lobby/lobby-page';
import { HomePlaymatBackdrop } from '@/components/layout/home-playmat-backdrop';
import { hasArcadeAccess } from '@/lib/auth/arcade-access';
import { listDecks } from '@/lib/data/decks';
import { getHomePlaymatId } from '@/lib/playmat-preference';
import { getUnlockedPlaymatId } from '@/lib/playmats';

import { TournamentApiError } from '@/lib/data/tournament-api-client';

export const metadata: Metadata = { title: 'Tornei' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Dashboard Tornei — lobby a tavoli. Sessione dal cookie, selezione dai
 * searchParams, tavoli dal Tournament Service (nessun mock).
 */
export default async function TorneiPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const invite = parseFriendInviteGamertag(params.add);
  const inviteQuery = invite ? `&add=${encodeURIComponent(invite)}` : '';
  const selection = parseSelection(params);
  if (!selection) redirect(`${DEFAULT_TOURNAMENTS_PATH}${inviteQuery}`);
  const lobbyFocus = parseLobbyFocus(params);

  const session = await getSession();
  if (!session) redirect('/login');
  const gamertag = await requireGamertag(
    `/tornei?format=${selection.format}&mode=${selection.mode}${inviteQuery}`,
  );
  const homePlaymatId = await getHomePlaymatId();

  const formatName = selection.format === 'all' ? 'Tutti i formati' : getFormat(selection.format)!.name;
  const modeName = getMode(selection.mode)!.name;
  // Fetch aggregato (tutti i formati): i MIEI tavoli devono restare visibili
  // anche quando sono in un altro formato, altrimenti il backend rifiuterebbe
  // di sedermi altrove (ALREADY_SEATED) senza che io possa abbandonarli.
  let tournaments;
  let decks;
  let reputation;
  let notifications;
  let arcadeAccessGranted;
  let initialFriends;

  try {
    [tournaments, decks, reputation, notifications, arcadeAccessGranted, initialFriends] =
      await Promise.all([
        getTournaments({ format: 'all', mode: selection.mode }),
        listDecks(session.user.id).catch(() => []),
        fetchMyReputation().catch(() => null),
        fetchNotificationSnapshot(),
        hasArcadeAccess(session.user.id),
        fetchFriendsList(gamertag)
          .then((friends) => friends.map(({ gamertag: friendGamertag, avatarId, presence }) => ({
            gamertag: friendGamertag,
            avatarId,
            presence,
          })))
          .catch(() => []),
      ]);
  } catch (err) {
    if (err instanceof TournamentApiError && err.status === 401) {
      redirect('/login');
    }
    throw err;
  }

  return (
    <>
      <HomePlaymatBackdrop
        playmatId={homePlaymatId
          ? getUnlockedPlaymatId(homePlaymatId, reputation?.qualifiedMatches30m ?? 0)
          : null}
      />
      <LobbyPage
        tournaments={tournaments}
        initialDecks={decks}
        user={session.user}
        gamertag={gamertag}
        selection={selection}
        formatId={selection.format}
        formatName={formatName}
        modeName={modeName}
        reputation={reputation}
        initialNotifications={notifications}
        initialFriends={initialFriends}
        arcadeAccessGranted={arcadeAccessGranted}
        focusTableId={lobbyFocus.tableId}
        openCreate={lobbyFocus.create === '1'}
      />
    </>
  );
}
