import 'server-only';

import { extractApiError, tournamentFetch } from '@/lib/data/tournament-api-client';
import {
  canUseSocialMockForError,
  canUseSocialMockForStatus,
} from '@/lib/data/social-fallback-policy';
import {
  loadStateFromDisk,
  mockFriendsStore,
  mockRawRequests,
  saveStateToDisk,
} from '@/lib/data/social-mock-store';

function saveMockOutgoingRequest(senderGamertag: string | null | undefined, targetGamertag: string): void {
  loadStateFromDisk();
  const sender = senderGamertag?.trim() || 'default';
  const recipient = targetGamertag.trim();
  const exists = mockRawRequests.some(
    (r) =>
      r.senderGamertag.toLowerCase() === sender.toLowerCase() &&
      r.recipientGamertag.toLowerCase() === recipient.toLowerCase(),
  );
  if (!exists) {
    mockRawRequests.push({
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderGamertag: sender,
      recipientGamertag: recipient,
      createdAt: Date.now(),
    });
    saveStateToDisk();
  }
}

export async function postSendFriendRequest(
  targetGamertag: string,
  myGamertag?: string | null,
): Promise<void> {
  const normalized = targetGamertag.trim();
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ gamertag: normalized }),
    });
    if (ok) return;
    if (canUseSocialMockForStatus(status)) {
      saveMockOutgoingRequest(myGamertag, normalized);
      return;
    }
    throw extractApiError(body, status, 'Impossibile inviare la richiesta di amicizia');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      saveMockOutgoingRequest(myGamertag, normalized);
      return;
    }
    throw err;
  }
}

export async function postRespondFriendRequest(
  requestId: string,
  action: 'accept' | 'decline',
  myGamertag?: string | null,
): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/requests/${encodeURIComponent(requestId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      },
    );
    if (ok) return;
    if (canUseSocialMockForStatus(status)) {
      handleMockRespond(requestId, action, myGamertag);
      return;
    }
    throw extractApiError(body, status, 'Impossibile rispondere alla richiesta');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      handleMockRespond(requestId, action, myGamertag);
      return;
    }
    throw err;
  }
}

function handleMockRespond(
  requestId: string,
  action: 'accept' | 'decline',
  myGamertag?: string | null,
): void {
  loadStateFromDisk();
  const idx = mockRawRequests.findIndex((r) => r.id === requestId);
  if (idx !== -1) {
    const req = mockRawRequests[idx];
    if (req && action === 'accept') {
      const sender = req.senderGamertag;
      const recipient = req.recipientGamertag;

      const friendsSender = mockFriendsStore.get(sender.toLowerCase()) ?? new Set();
      friendsSender.add(recipient);
      mockFriendsStore.set(sender.toLowerCase(), friendsSender);

      const friendsRecipient = mockFriendsStore.get(recipient.toLowerCase()) ?? new Set();
      friendsRecipient.add(sender);
      mockFriendsStore.set(recipient.toLowerCase(), friendsRecipient);
    }
    mockRawRequests.splice(idx, 1);
    saveStateToDisk();
  }
}

export async function postCancelFriendRequest(
  requestId: string,
  myGamertag?: string | null,
): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/requests/${encodeURIComponent(requestId)}`,
      { method: 'DELETE' },
    );
    if (ok) return;
    if (canUseSocialMockForStatus(status)) {
      handleMockCancel(requestId);
      return;
    }
    throw extractApiError(body, status, 'Impossibile annullare la richiesta');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      handleMockCancel(requestId);
      return;
    }
    throw err;
  }
}

function handleMockCancel(requestId: string): void {
  loadStateFromDisk();
  const idx = mockRawRequests.findIndex((r) => r.id === requestId);
  if (idx !== -1) {
    mockRawRequests.splice(idx, 1);
    saveStateToDisk();
  }
}

export async function postRemoveFriend(
  targetGamertag: string,
  myGamertag?: string | null,
): Promise<void> {
  const normalized = targetGamertag.trim();
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/friends/${encodeURIComponent(normalized)}`,
      { method: 'DELETE' },
    );
    if (ok) return;
    if (canUseSocialMockForStatus(status)) {
      handleMockRemove(myGamertag, normalized);
      return;
    }
    throw extractApiError(body, status, 'Impossibile rimuovere l’amico');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      handleMockRemove(myGamertag, normalized);
      return;
    }
    throw err;
  }
}

function handleMockRemove(myGamertag: string | null | undefined, targetGamertag: string): void {
  loadStateFromDisk();
  if (myGamertag) {
    const myFriends = mockFriendsStore.get(myGamertag.toLowerCase());
    if (myFriends) {
      myFriends.delete(targetGamertag);
      mockFriendsStore.set(myGamertag.toLowerCase(), myFriends);
    }
  }
  const otherFriends = mockFriendsStore.get(targetGamertag.toLowerCase());
  if (otherFriends && myGamertag) {
    otherFriends.delete(myGamertag);
    mockFriendsStore.set(targetGamertag.toLowerCase(), otherFriends);
  }
  saveStateToDisk();
}
