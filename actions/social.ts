'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { fetchMyGamertag } from '@/lib/data/player-api-client';
import {
  fetchFriendRequests,
  fetchFriendsList,
  fetchPublicProfile,
  postCancelFriendRequest,
  postRemoveFriend,
  postRespondFriendRequest,
  postSendFriendRequest,
  searchPlayers,
} from '@/lib/data/social-api-client';
import { setEbartexProfileVisible, setPlayerDnd } from '@/lib/data/social-mock-store';
import {
  friendRequestSchema,
  removeFriendSchema,
  respondFriendRequestSchema,
  searchPlayersSchema,
} from '@/lib/validations/social';
import type {
  FriendRequestItem,
  FriendSummary,
  PublicPlayerProfile,
  SocialActionState,
} from '@/types/social';

export async function getPublicProfileAction(
  gamertag: string,
): Promise<SocialActionState<PublicPlayerProfile>> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = friendRequestSchema.safeParse({ gamertag });
  if (!parsed.success) return { ok: false, error: 'Gamertag non valido.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const myEbartexUsername = session.user.name ?? null;
    const profile = await fetchPublicProfile(parsed.data.gamertag, myGamertag, myEbartexUsername);
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
    const myGamertag = await fetchMyGamertag().catch(() => null);
    const requests = await fetchFriendRequests(myGamertag);
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

    await postSendFriendRequest(parsed.data.gamertag, myGamertag);
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
    const myGamertag = await fetchMyGamertag().catch(() => null);
    await postRespondFriendRequest(parsed.data.requestId, parsed.data.action, myGamertag);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile rispondere alla richiesta.';
    return { ok: false, error: message };
  }
}

export async function cancelFriendRequestAction(requestId: string): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };
  if (!requestId || typeof requestId !== 'string') return { ok: false, error: 'ID richiesta non valido.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    await postCancelFriendRequest(requestId, myGamertag);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile annullare la richiesta.';
    return { ok: false, error: message };
  }
}

export async function removeFriendAction(gamertag: string): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = removeFriendSchema.safeParse({ gamertag });
  if (!parsed.success) return { ok: false, error: 'Gamertag non valido.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    await postRemoveFriend(parsed.data.gamertag, myGamertag);
    revalidatePath('/tornei');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile rimuovere l’amico.';
    return { ok: false, error: message };
  }
}

export async function setSocialDndAction(active: boolean, durationMinutes = 60): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (myGamertag) {
      if (active) setPlayerDnd(myGamertag, durationMinutes);
      else setPlayerDnd(myGamertag, 0);
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile aggiornare lo stato.';
    return { ok: false, error: message };
  }
}

export async function setSocialEbartexVisibilityAction(visible: boolean): Promise<SocialActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    const myGamertag = await fetchMyGamertag().catch(() => null);
    if (myGamertag) {
      setEbartexProfileVisible(myGamertag, visible);
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Impossibile aggiornare la visibilità.';
    return { ok: false, error: message };
  }
}
