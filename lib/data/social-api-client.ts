import 'server-only';

import { extractApiError, tournamentFetch, TournamentApiError } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import {
  buildFallbackPublicProfile,
  getAvatarIdForGamertag,
  mockChallengesStore,
  mockFriendsStore,
  mockRequestsStore,
} from '@/lib/data/social-mock-store';
import type {
  DirectGameChallenge,
  FriendPresenceStatus,
  FriendRequestItem,
  FriendSummary,
  PublicPlayerProfile,
} from '@/types/social';

export async function fetchPublicProfile(
  targetGamertag: string,
  myGamertag?: string | null,
): Promise<PublicPlayerProfile | null> {
  try {
    const { ok, body } = await tournamentFetch(
      `/api/v1/players/${encodeURIComponent(targetGamertag)}/public-profile`,
    );
    if (ok) {
      const data = unwrapApiPayload<PublicPlayerProfile>(body);
      if (data) return data;
    }
  } catch {
    // Fallback a dati deterministici simulati
  }

  return buildFallbackPublicProfile(targetGamertag, myGamertag);
}

export async function fetchFriendsList(myGamertag?: string | null): Promise<FriendSummary[]> {
  try {
    const { ok, body } = await tournamentFetch('/api/v1/friends');
    if (ok) {
      const data = unwrapApiPayload<FriendSummary[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  const friendTags = Array.from(mockFriendsStore.get('default') ?? []);
  return friendTags.map((tag, idx) => {
    const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
    const presence = presenceList[idx % presenceList.length];
    const statusText =
      presence === 'in_game'
        ? 'In partita'
        : presence === 'recent'
          ? 'Attivo di recente'
          : presence === 'offline'
            ? 'Non attivo di recente'
            : 'Nella Lobby';

    return {
      gamertag: tag,
      avatarId: getAvatarIdForGamertag(tag),
      presence,
      statusText,
      winStreak: (idx * 2) % 6,
      dailyWins: idx % 4,
    };
  });
}

export async function fetchFriendRequests(): Promise<FriendRequestItem[]> {
  try {
    const { ok, body } = await tournamentFetch('/api/v1/friends/requests');
    if (ok) {
      const data = unwrapApiPayload<FriendRequestItem[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  return mockRequestsStore.get('default') ?? [];
}

export async function searchPlayers(query: string, myGamertag?: string | null): Promise<FriendSummary[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const { ok, body } = await tournamentFetch(`/api/v1/players/search?q=${encodeURIComponent(q)}`);
    if (ok) {
      const data = unwrapApiPayload<FriendSummary[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  const basePool = [
    'Alex_TCG',
    'Valerio_Magic',
    'Sara_Draws',
    'Kurogane',
    'DeckMaster99',
    'BlackLotus_Fan',
    'Chandra_Flame',
    'Jace_Mind',
    'Liliana_Dread',
  ];

  const friends = Array.from(mockFriendsStore.get('default') ?? []);
  const allKnown = Array.from(new Set([...basePool, ...friends]));

  const qLower = q.toLowerCase();
  const matched = allKnown.filter(
    (name) => name.toLowerCase().includes(qLower) && name.toLowerCase() !== myGamertag?.toLowerCase(),
  );

  // Se l'utente cerca un gamertag specifico (es. altro account) non ancora presente, lo includiamo
  if (
    q.length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(q) &&
    !matched.some((m) => m.toLowerCase() === qLower) &&
    qLower !== myGamertag?.toLowerCase()
  ) {
    matched.unshift(q);
  }

  return matched.slice(0, 10).map((tag, idx) => ({
    gamertag: tag,
    avatarId: getAvatarIdForGamertag(tag),
    presence: (idx % 2 === 0 ? 'online' : 'recent') as FriendPresenceStatus,
    statusText: idx % 2 === 0 ? 'Online' : 'Attivo di recente',
    winStreak: idx % 3,
    dailyWins: idx % 2,
  }));
}

export async function postSendFriendRequest(targetGamertag: string): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ gamertag: targetGamertag }),
    });
    if (!ok) throw extractApiError(body, status, 'Impossibile inviare la richiesta di amicizia');
  } catch (err) {
    if (err instanceof TournamentApiError && err.code === 'API_NOT_CONFIGURED') {
      const friends = mockFriendsStore.get('default') ?? new Set();
      friends.add(targetGamertag.trim());
      mockFriendsStore.set('default', friends);
      return;
    }
    throw err;
  }
}

export async function postRespondFriendRequest(requestId: string, action: 'accept' | 'decline'): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(`/api/v1/friends/requests/${encodeURIComponent(requestId)}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    if (!ok) throw extractApiError(body, status, 'Impossibile rispondere alla richiesta');
  } catch (err) {
    if (err instanceof TournamentApiError && err.code === 'API_NOT_CONFIGURED') {
      const requests = mockRequestsStore.get('default') ?? [];
      const item = requests.find((r) => r.id === requestId);
      if (item && action === 'accept') {
        const friends = mockFriendsStore.get('default') ?? new Set();
        friends.add(item.gamertag);
        mockFriendsStore.set('default', friends);
      }
      mockRequestsStore.set(
        'default',
        requests.filter((r) => r.id !== requestId),
      );
      return;
    }
    throw err;
  }
}

export async function postRemoveFriend(targetGamertag: string): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/${encodeURIComponent(targetGamertag)}`,
      { method: 'DELETE' },
    );
    if (!ok) throw extractApiError(body, status, 'Impossibile rimuovere l’amico');
  } catch (err) {
    if (err instanceof TournamentApiError && err.code === 'API_NOT_CONFIGURED') {
      const friends = mockFriendsStore.get('default') ?? new Set();
      friends.delete(targetGamertag.trim());
      mockFriendsStore.set('default', friends);
      return;
    }
    throw err;
  }
}

export async function postCreateGameChallenge(challenge: {
  challengerGamertag: string;
  challengerAvatarId: string;
  recipientGamertag: string;
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
}): Promise<DirectGameChallenge> {
  const challengeId = `ch-${Date.now()}`;
  const record: DirectGameChallenge = {
    id: challengeId,
    ...challenge,
    expiresAt: Date.now() + 60_000,
    status: 'pending',
  };
  mockChallengesStore.set(challengeId, record);
  return record;
}

export async function fetchActiveChallengeForUser(recipientGamertag: string): Promise<DirectGameChallenge | null> {
  const now = Date.now();
  for (const [, ch] of mockChallengesStore.entries()) {
    if (ch.recipientGamertag.toLowerCase() === recipientGamertag.toLowerCase() && ch.status === 'pending') {
      if (ch.expiresAt > now) return ch;
      ch.status = 'expired';
    }
  }
  return null;
}
