import 'server-only';

import { extractApiError, tournamentFetch, TournamentApiError } from '@/lib/data/tournament-api-client';
import {
  getAvatarIdForGamertag,
  mockFriendsStore,
  mockRequestsStore,
} from '@/lib/data/social-mock-store';

export async function postSendFriendRequest(targetGamertag: string): Promise<void> {
  const normalized = targetGamertag.trim();
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ gamertag: normalized }),
    });
    if (!ok) throw extractApiError(body, status, 'Impossibile inviare la richiesta di amicizia');
  } catch (err) {
    if (err instanceof TournamentApiError && err.code === 'API_NOT_CONFIGURED') {
      const requests = mockRequestsStore.get('default') ?? [];
      const exists = requests.some((r) => r.gamertag.toLowerCase() === normalized.toLowerCase());
      if (!exists) {
        requests.push({
          id: `req-out-${Date.now()}`,
          gamertag: normalized,
          avatarId: getAvatarIdForGamertag(normalized),
          createdAtText: 'Oggi',
          direction: 'outgoing',
        });
        mockRequestsStore.set('default', requests);
      }
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

export async function postCancelFriendRequest(requestId: string): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/requests/${encodeURIComponent(requestId)}`,
      { method: 'DELETE' },
    );
    if (!ok) throw extractApiError(body, status, 'Impossibile annullare la richiesta');
  } catch (err) {
    if (err instanceof TournamentApiError && err.code === 'API_NOT_CONFIGURED') {
      const requests = mockRequestsStore.get('default') ?? [];
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
