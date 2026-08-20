import 'server-only';

import { isMockBot, mockChallengesStore } from '@/lib/data/social-mock-store';
import type { DirectGameChallenge } from '@/types/social';

export async function postCreateGameChallenge(challenge: {
  challengerGamertag: string;
  challengerAvatarId: string;
  recipientGamertag: string;
  format: string;
  bestOf: 'BO1' | 'BO3' | 'BO5';
}): Promise<DirectGameChallenge> {
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
  const ch = mockChallengesStore.get(challengeId);
  if (!ch) return null;
  if (ch.status === 'pending' && ch.expiresAt <= Date.now()) {
    ch.status = 'expired';
  }
  return ch;
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

export async function postRespondGameChallenge(
  challengeId: string,
  action: 'accept' | 'decline',
  tableId?: string,
): Promise<DirectGameChallenge | null> {
  const ch = mockChallengesStore.get(challengeId);
  if (!ch) return null;
  ch.status = action === 'accept' ? 'accepted' : 'declined';
  if (tableId) ch.tableId = tableId;
  return ch;
}

export async function fetchOutgoingChallengeStatus(challengeId: string): Promise<DirectGameChallenge | null> {
  return fetchChallengeById(challengeId);
}

export async function postCancelGameChallenge(challengeId: string): Promise<void> {
  const ch = mockChallengesStore.get(challengeId);
  if (ch && ch.status === 'pending') {
    ch.status = 'declined';
  }
}
