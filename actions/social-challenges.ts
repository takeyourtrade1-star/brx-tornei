'use server';

import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import {
  fetchActiveChallengeForUser,
  postCreateGameChallenge,
} from '@/lib/data/social-api-client';
import { isPlayerDnd } from '@/lib/data/social-mock-store';
import { createTournament } from '@/lib/data/tournaments';
import {
  respondGameChallengeSchema,
  sendGameChallengeSchema,
} from '@/lib/validations/social';
import type { DirectGameChallenge, SocialActionState } from '@/types/social';

export async function sendGameChallengeAction(
  targetGamertag: string,
  format: string,
  bestOf: 'BO1' | 'BO3' | 'BO5',
): Promise<SocialActionState<DirectGameChallenge>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = sendGameChallengeSchema.safeParse({ targetGamertag, format, bestOf });
  if (!parsed.success) return { ok: false, error: 'Parametri sfida non validi.' };

  try {
    const myGamertag = (await fetchMyGamertag().catch(() => null)) ?? session.user.name ?? 'Player';
    if (myGamertag.toLowerCase() === parsed.data.targetGamertag.toLowerCase()) {
      return { ok: false, error: 'Non puoi sfidare te stesso.' };
    }

    if (isPlayerDnd(parsed.data.targetGamertag)) {
      return {
        ok: false,
        error: `${parsed.data.targetGamertag} ha impostato "Non disturbare" per il momento e non può ricevere inviti di sfida.`,
      };
    }

    const challenge = await postCreateGameChallenge({
      challengerGamertag: myGamertag,
      challengerAvatarId: 'crown',
      recipientGamertag: parsed.data.targetGamertag,
      format: parsed.data.format,
      bestOf: parsed.data.bestOf,
    });
    return { ok: true, data: challenge };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile inviare la sfida.';
    return { ok: false, error: message };
  }
}

export async function checkIncomingChallengeAction(): Promise<SocialActionState<DirectGameChallenge | null>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (!myGamertag) return { ok: true, data: null };

    // Se l'utente ha DND attivo, blocca la ricezione delle sfide
    if (isPlayerDnd(myGamertag)) return { ok: true, data: null };

    const challenge = await fetchActiveChallengeForUser(myGamertag);
    return { ok: true, data: challenge };
  } catch {
    return { ok: true, data: null };
  }
}

export async function respondGameChallengeAction(
  challengeId: string,
  action: 'accept' | 'decline',
): Promise<SocialActionState<{ tableId?: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = respondGameChallengeSchema.safeParse({ challengeId, action });
  if (!parsed.success) return { ok: false, error: 'Dati sfida non validi.' };

  try {
    if (parsed.data.action === 'accept') {
      const tournament = await createTournament(
        {
          format: 'modern',
          mode: 'heads-up',
          bestOf: 'BO3',
          isPrivate: true,
          withFriend: true,
          isTournament: false,
          enableScryfallCheck: false,
          enablePhysicalVerification: false,
        },
        {
          id: session.user.id,
          username: session.user.name ?? session.user.email,
        },
      );
      return { ok: true, data: { tableId: tournament.id } };
    }
    return { ok: true, data: {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nella gestione della sfida.';
    return { ok: false, error: message };
  }
}
