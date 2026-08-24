'use server';

import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import {
  fetchActiveChallengeForUser,
  fetchChallengeById,
  fetchOutgoingChallengeStatus,
  postCancelGameChallenge,
  postCreateGameChallenge,
  postRespondGameChallenge,
} from '@/lib/data/social-api-client';
import { isMockBot, isPlayerDnd } from '@/lib/data/social-mock-store';
import { createTournament, joinTournament } from '@/lib/data/tournaments';
import {
  respondGameChallengeSchema,
  sendGameChallengeSchema,
} from '@/lib/validations/social';
import { formatIdSchema } from '@/lib/validations/selection';
import type { DirectGameChallenge, SocialActionState } from '@/types/social';

function sameGamertag(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

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
    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (!myGamertag) {
      return { ok: false, error: 'Imposta un gamertag prima di giocare.' };
    }
    if (sameGamertag(myGamertag, parsed.data.targetGamertag)) {
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

    // Bot solo nel fallback mock locale: il backend non ha giocatori fittizi.
    if (challenge.isBot && !challenge.tableId && isMockBot(parsed.data.targetGamertag)) {
      const validFormat = formatIdSchema.safeParse(parsed.data.format).data ?? 'modern';
      const tournament = await createTournament(
        {
          format: validFormat,
          mode: 'heads-up',
          bestOf: parsed.data.bestOf,
          isPrivate: false,
          withFriend: true,
          isTournament: false,
          enableScryfallCheck: false,
          enablePhysicalVerification: false,
        },
        {
          id: session.user.id,
          username: myGamertag,
        },
      );
      await postRespondGameChallenge(challenge.id, 'accept', tournament.id);
      challenge.status = 'accepted';
      challenge.tableId = tournament.id;
    }

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

    if (isPlayerDnd(myGamertag)) return { ok: true, data: null };

    const challenge = await fetchActiveChallengeForUser(myGamertag);
    if (challenge && sameGamertag(challenge.challengerGamertag, myGamertag)) {
      return { ok: true, data: null };
    }
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
    const existing = await fetchChallengeById(parsed.data.challengeId);
    if (!existing) return { ok: false, error: 'Sfida non trovata o scaduta.' };

    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (
      myGamertag &&
      sameGamertag(existing.challengerGamertag, myGamertag)
    ) {
      return { ok: false, error: 'Non puoi accettare una sfida contro te stesso.' };
    }

    if (parsed.data.action === 'accept' && !existing.tableId) {
      // Fallback mock: il tavolo non esiste ancora, va creato pubblico.
      const validFormat = formatIdSchema.safeParse(existing.format).data ?? 'modern';
      const tournament = await createTournament(
        {
          format: validFormat,
          mode: 'heads-up',
          bestOf: existing.bestOf || 'BO3',
          isPrivate: false,
          withFriend: true,
          isTournament: false,
          enableScryfallCheck: false,
          enablePhysicalVerification: false,
        },
        {
          id: session.user.id,
          username: myGamertag ?? session.user.name ?? session.user.email,
        },
      );
      const updated = await postRespondGameChallenge(existing.id, 'accept', tournament.id);
      return { ok: true, data: { tableId: updated?.tableId ?? tournament.id } };
    }

    const challenge = await postRespondGameChallenge(parsed.data.challengeId, parsed.data.action);
    if (parsed.data.action === 'accept' && !challenge?.tableId) {
      return { ok: false, error: 'La sfida è stata accettata ma il tavolo non è pronto.' };
    }
    return { ok: true, data: { tableId: challenge?.tableId } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nella gestione della sfida.';
    return { ok: false, error: message };
  }
}

export async function checkOutgoingChallengeStatusAction(
  challengeId: string,
): Promise<SocialActionState<{ status: 'pending' | 'accepted' | 'declined' | 'expired'; tableId?: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const challenge = await fetchOutgoingChallengeStatus(challengeId);
    if (!challenge) {
      return { ok: true, data: { status: 'expired' } };
    }

    if (challenge.status === 'accepted' && challenge.tableId) {
      try {
        await joinTournament(challenge.tableId, {
          id: session.user.id,
          username: session.user.name ?? session.user.email,
        });
      } catch {
        // Già seduto (lo sfidante ha aperto il tavolo all'invio) o join implicito.
      }
      return { ok: true, data: { status: 'accepted', tableId: challenge.tableId } };
    }

    return { ok: true, data: { status: challenge.status, tableId: challenge.tableId } };
  } catch {
    return { ok: true, data: { status: 'expired' } };
  }
}

export async function cancelGameChallengeAction(challengeId: string): Promise<SocialActionState<void>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    await postCancelGameChallenge(challengeId);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile annullare la sfida.';
    return { ok: false, error: message };
  }
}
