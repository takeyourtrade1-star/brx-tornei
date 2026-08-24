import 'server-only';

import { extractApiError, tournamentFetch } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import { mapGameChallenge } from '@/lib/data/social-api-mapper';
import {
  canUseSocialMockForError,
  canUseSocialMockForStatus,
} from '@/lib/data/social-fallback-policy';
import { isMockBot, mockChallengesStore } from '@/lib/data/social-mock-store';
import type { DirectGameChallenge } from '@/types/social';

function requireChallenge(raw: unknown, fallback: string): DirectGameChallenge {
  const mapped = mapGameChallenge(raw);
  if (!mapped) {
    throw extractApiError({ detail: fallback }, 502, fallback);
  }
  return mapped;
}

export async function postCreateGameChallenge(challenge: {
  challengerGamertag: string;
  challengerAvatarId: string;
  recipientGamertag: string;
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
}): Promise<DirectGameChallenge> {
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/challenges', {
      method: 'POST',
      body: JSON.stringify({
        gamertag: challenge.recipientGamertag,
        format: challenge.format,
        bestOf: challenge.bestOf,
        challengerAvatarId: challenge.challengerAvatarId,
      }),
    });
    if (ok) {
      return requireChallenge(unwrapApiPayload(body), 'Risposta sfida non valida');
    }
    if (canUseSocialMockForStatus(status)) {
      return createMockChallenge(challenge);
    }
    throw extractApiError(body, status, 'Impossibile inviare la sfida');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      return createMockChallenge(challenge);
    }
    throw err;
  }
}

function createMockChallenge(challenge: {
  challengerGamertag: string;
  challengerAvatarId: string;
  recipientGamertag: string;
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
}): DirectGameChallenge {
  const challengeId = `ch-${Date.now()}`;
  const isBot = isMockBot(challenge.recipientGamertag);
  const record: DirectGameChallenge = {
    id: challengeId,
    ...challenge,
    expiresAt: Date.now() + 60_000,
    status: 'pending',
    isBot,
  };
  mockChallengesStore.set(challengeId, record);
  return record;
}

export async function fetchChallengeById(challengeId: string): Promise<DirectGameChallenge | null> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/challenges/${encodeURIComponent(challengeId)}`,
    );
    if (ok) {
      return mapGameChallenge(unwrapApiPayload(body));
    }
    if (status === 404) {
      return canUseSocialMockForStatus(status) ? readMockChallenge(challengeId) : null;
    }
    if (canUseSocialMockForStatus(status)) return readMockChallenge(challengeId);
    throw extractApiError(body, status, 'Impossibile leggere la sfida');
  } catch (err) {
    if (canUseSocialMockForError(err)) return readMockChallenge(challengeId);
    throw err;
  }
}

function readMockChallenge(challengeId: string): DirectGameChallenge | null {
  const ch = mockChallengesStore.get(challengeId);
  if (!ch) return null;
  if (ch.status === 'pending' && ch.expiresAt <= Date.now()) {
    ch.status = 'expired';
  }
  return ch;
}

export async function fetchActiveChallengeForUser(
  recipientGamertag: string,
): Promise<DirectGameChallenge | null> {
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/challenges/incoming');
    if (ok) {
      const payload = unwrapApiPayload(body);
      if (payload == null) return null;
      const mapped = mapGameChallenge(payload);
      if (
        mapped &&
        mapped.challengerGamertag.toLowerCase() === recipientGamertag.trim().toLowerCase()
      ) {
        return null;
      }
      return mapped;
    }
    if (canUseSocialMockForStatus(status)) {
      return readMockIncoming(recipientGamertag);
    }
    throw extractApiError(body, status, 'Impossibile leggere le sfide in arrivo');
  } catch (err) {
    if (canUseSocialMockForError(err)) return readMockIncoming(recipientGamertag);
    throw err;
  }
}

function readMockIncoming(recipientGamertag: string): DirectGameChallenge | null {
  const now = Date.now();
  const me = recipientGamertag.toLowerCase();
  for (const [, ch] of mockChallengesStore.entries()) {
    if (ch.challengerGamertag.toLowerCase() === me) continue;
    if (ch.recipientGamertag.toLowerCase() === me && ch.status === 'pending') {
      if (ch.expiresAt > now) return ch;
      ch.status = 'expired';
    }
  }
  return null;
}

export async function postRespondGameChallenge(
  challengeId: string,
  action: 'accept' | 'decline',
  tableId?: string,
): Promise<DirectGameChallenge | null> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/challenges/${encodeURIComponent(challengeId)}/respond`,
      { method: 'POST', body: JSON.stringify({ action }) },
    );
    if (ok) {
      return mapGameChallenge(unwrapApiPayload(body));
    }
    if (canUseSocialMockForStatus(status)) {
      return respondMock(challengeId, action, tableId);
    }
    throw extractApiError(body, status, 'Impossibile rispondere alla sfida');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      return respondMock(challengeId, action, tableId);
    }
    throw err;
  }
}

function respondMock(
  challengeId: string,
  action: 'accept' | 'decline',
  tableId?: string,
): DirectGameChallenge | null {
  const ch = mockChallengesStore.get(challengeId);
  if (!ch) return null;
  ch.status = action === 'accept' ? 'accepted' : 'declined';
  if (tableId) ch.tableId = tableId;
  return ch;
}

export async function fetchOutgoingChallengeStatus(
  challengeId: string,
): Promise<DirectGameChallenge | null> {
  return fetchChallengeById(challengeId);
}

export async function postCancelGameChallenge(challengeId: string): Promise<void> {
  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/challenges/${encodeURIComponent(challengeId)}/cancel`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    if (ok) return;
    if (canUseSocialMockForStatus(status)) {
      cancelMock(challengeId);
      return;
    }
    throw extractApiError(body, status, 'Impossibile annullare la sfida');
  } catch (err) {
    if (canUseSocialMockForError(err)) {
      cancelMock(challengeId);
      return;
    }
    throw err;
  }
}

function cancelMock(challengeId: string): void {
  const ch = mockChallengesStore.get(challengeId);
  if (ch && ch.status === 'pending') {
    ch.status = 'declined';
  }
}
