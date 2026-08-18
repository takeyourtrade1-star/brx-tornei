import 'server-only';

import { extractApiError, tournamentFetch, TournamentApiError } from '@/lib/data/tournament-api-client';
import {
  getAvatarIdForGamertag,
  mockFriendsStore,
  mockRequestsStore,
} from '@/lib/data/social-mock-store';

function saveMockOutgoingRequest(normalized: string): void {
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
}

export async function postSendFriendRequest(targetGamertag: string): Promise<void> {
  const normalized = targetGamertag.trim();
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ gamertag: normalized }),
    });
    if (ok) return;
    if (status === 404 || status >= 500) {
      saveMockOutgoingRequest(normalized);
      return;
    }
    throw extractApiError(body, status, 'Impossibile inviare la richiesta di amicizia');
  } catch (err) {
    if (
      err instanceof TournamentApiError &&
      (err.code === 'API_NOT_CONFIGURED' || err.status === 404 || err.status >= 500)
    ) {
      saveMockOutgoingRequest(normalized);
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
    if (ok) return;
    if (status === 404 || status >= 500) {
      handleMockRespond(requestId, action);
      return;
    }
    throw extractApiError(body, status, 'Impossibile rispondere alla richiesta');
  } catch (err) {
    if (
      err instanceof TournamentApiError &&
      (err.code === 'API_NOT_CONFIGURED' || err.status === 404 || err.status >= 500)
    ) {
      handleMockRespond(requestId, action);
      return;
    }
    throw err;
  }
}

function handleMockRespond(requestId: string, action: 'accept' | 'decline'): void {
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
}

export async function postCancelFriendRequest(requestId: string): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/requests/${encodeURIComponent(requestId)}`,
      { method: 'DELETE' },
    );
    if (ok) return;
    if (status === 404 || status >= 500) {
      handleMockCancel(requestId);
      return;
    }
    throw extractApiError(body, status, 'Impossibile annullare la richiesta');
  } catch (err) {
    if (
      err instanceof TournamentApiError &&
      (err.code === 'API_NOT_CONFIGURED' || err.status === 404 || err.status >= 500)
    ) {
      handleMockCancel(requestId);
      return;
    }
    throw err;
  }
}

function handleMockCancel(requestId: string): void {
  const requests = mockRequestsStore.get('default') ?? [];
  mockRequestsStore.set(
    'default',
    requests.filter((r) => r.id !== requestId),
  );
}

export async function postRemoveFriend(targetGamertag: string): Promise<void> {
  const normalized = targetGamertag.trim();
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/${encodeURIComponent(normalized)}`,
      { method: 'DELETE' },
    );
    if (ok) return;
    if (status === 404 || status >= 500) {
      handleMockRemove(normalized);
      return;
    }
    throw extractApiError(body, status, 'Impossibile rimuovere l’amico');
  } catch (err) {
    if (
      err instanceof TournamentApiError &&
      (err.code === 'API_NOT_CONFIGURED' || err.status === 404 || err.status >= 500)
    ) {
      handleMockRemove(normalized);
      return;
    }
    throw err;
  }
}

function handleMockRemove(normalized: string): void {
  const friends = mockFriendsStore.get('default') ?? new Set();
  friends.delete(normalized);
  mockFriendsStore.set('default', friends);
}
