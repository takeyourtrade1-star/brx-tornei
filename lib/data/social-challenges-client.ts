import 'server-only';

import { mockChallengesStore } from '@/lib/data/social-mock-store';
import type { DirectGameChallenge } from '@/types/social';

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
