'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import {
  fetchActiveChallengeForUser,
  fetchFriendRequests,
  fetchFriendsList,
  fetchPublicProfile,
  postCreateGameChallenge,
  postRemoveFriend,
  postRespondFriendRequest,
  postSendFriendRequest,
  searchPlayers,
} from '@/lib/data/social-api-client';
import { createTournament } from '@/lib/data/tournaments';
import {
  friendRequestSchema,
  removeFriendSchema,
  respondFriendRequestSchema,
  respondGameChallengeSchema,
  searchPlayersSchema,
  sendGameChallengeSchema,
} from '@/lib/validations/social';
import type {
  DirectGameChallenge,
  FriendRequestItem,
  FriendSummary,
  PublicPlayerProfile,
} from '@/types/social';

export interface SocialActionState<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function getPublicProfileAction(
  gamertag: string,
): Promise<SocialActionState<PublicPlayerProfile>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = friendRequestSchema.safeParse({ gamertag });
  if (!parsed.success) return { ok: false, error: 'Gamertag non valido.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const profile = await fetchPublicProfile(parsed.data.gamertag, myGamertag);
    if (!profile) return { ok: false, error: 'Profilo giocatore non trovato.' };
    return { ok: true, data: profile };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile caricare il profilo.';
    return { ok: false, error: message };
  }
}

export async function getFriendsListAction(): Promise<SocialActionState<FriendSummary[]>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const list = await fetchFriendsList(myGamertag);
    return { ok: true, data: list };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile caricare gli amici.';
    return { ok: false, error: message };
  }
}

export async function getFriendRequestsAction(): Promise<SocialActionState<FriendRequestItem[]>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const requests = await fetchFriendRequests();
    return { ok: true, data: requests };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile caricare le richieste.';
    return { ok: false, error: message };
  }
}

export async function searchPlayersAction(query: string): Promise<SocialActionState<FriendSummary[]>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = searchPlayersSchema.safeParse({ query });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Ricerca non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const results = await searchPlayers(parsed.data.query, myGamertag);
    return { ok: true, data: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore durante la ricerca.';
    return { ok: false, error: message };
  }
}

export async function sendFriendRequestAction(gamertag: string): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = friendRequestSchema.safeParse({ gamertag });
  if (!parsed.success) return { ok: false, error: 'Gamertag non valido.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (myGamertag && myGamertag.toLowerCase() === parsed.data.gamertag.toLowerCase()) {
      return { ok: false, error: 'Non puoi inviare una richiesta a te stesso.' };
    }

    await postSendFriendRequest(parsed.data.gamertag);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile inviare la richiesta.';
    return { ok: false, error: message };
  }
}

export async function respondFriendRequestAction(
  requestId: string,
  action: 'accept' | 'decline',
): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = respondFriendRequestSchema.safeParse({ requestId, action });
  if (!parsed.success) return { ok: false, error: 'Dati non validi.' };

  try {
    await postRespondFriendRequest(parsed.data.requestId, parsed.data.action);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile rispondere alla richiesta.';
    return { ok: false, error: message };
  }
}

export async function removeFriendAction(gamertag: string): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = removeFriendSchema.safeParse({ gamertag });
  if (!parsed.success) return { ok: false, error: 'Gamertag non valido.' };

  try {
    await postRemoveFriend(parsed.data.gamertag);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile rimuovere l’amico.';
    return { ok: false, error: message };
  }
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
    const myGamertag = (await fetchMyGamertag().catch(() => null)) ?? session.user.name ?? 'Player';
    if (myGamertag.toLowerCase() === parsed.data.targetGamertag.toLowerCase()) {
      return { ok: false, error: 'Non puoi sfidare te stesso.' };
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
