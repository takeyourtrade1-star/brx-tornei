import 'server-only';

import {
  extractApiError,
  tournamentFetch,
  TournamentApiError,
} from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import { fetchMyMatchFeedback } from '@/lib/data/match-feedback';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import {
  buildFallbackPublicProfile,
} from '@/lib/data/social-mock-store';
import {
  fetchMockFriendRequests,
  fetchMockFriendsList,
  searchMockPlayers,
} from '@/lib/data/social-mock-readers';
import {
  mapFriendRequestList,
  mapFriendSummaryList,
  mapPublicPlayerProfile,
} from '@/lib/data/social-api-mapper';
import { canUseSocialMockForError } from '@/lib/data/social-fallback-policy';
import type {
  FriendRequestItem,
  FriendSummary,
  PublicPlayerProfile,
} from '@/types/social';

export {
  postSendFriendRequest,
  postRespondFriendRequest,
  postCancelFriendRequest,
  postRemoveFriend,
} from './social-friendship-client';

export {
  postCreateGameChallenge,
  fetchActiveChallengeForUser,
  fetchChallengeById,
  postRespondGameChallenge,
  fetchOutgoingChallengeStatus,
  postCancelGameChallenge,
} from './social-challenges-client';

export async function fetchPublicProfile(
  targetGamertag: string,
  myGamertag?: string | null,
  myEbartexUsername?: string | null,
): Promise<PublicPlayerProfile | null> {
  const isSelf = Boolean(
    myGamertag && targetGamertag.trim().toLowerCase() === myGamertag.trim().toLowerCase(),
  );

  let realFeedbackMap: Record<string, number> | null = null;
  if (isSelf) {
    try {
      const fb = await fetchMyMatchFeedback();
      if (fb?.badges) {
        realFeedbackMap = {};
        for (const b of fb.badges) {
          realFeedbackMap[b.badge] = b.count;
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const { ok, status, body } = await tournamentFetch(
      `/api/v1/players/${encodeURIComponent(targetGamertag)}/public-profile`,
    );
    if (!ok) {
      throw extractApiError(body, status, 'Impossibile caricare il profilo pubblico');
    }
    const data = mapPublicPlayerProfile(unwrapApiPayload<unknown>(body));
    if (!data) {
      throw new TournamentApiError('Risposta profilo non valida', 502, 'INVALID_RESPONSE');
    }
    if (realFeedbackMap) {
      data.honorBadges = {
        friendly: realFeedbackMap['friendly'] ?? 0,
        sportive: realFeedbackMap['sportive'] ?? 0,
        great_player: realFeedbackMap['great_player'] ?? 0,
        strategist: realFeedbackMap['strategist'] ?? 0,
        punctual: realFeedbackMap['punctual'] ?? 0,
      };
    }
    if (isSelf && myEbartexUsername) {
      data.ebartexUsername = myEbartexUsername;
    }
    return data;
  } catch (err) {
    if (!canUseSocialMockForError(err)) throw err;
  }

  const profile = buildFallbackPublicProfile(targetGamertag, myGamertag, myEbartexUsername);

  if (isSelf) {
    try {
      const rep = await fetchMyReputation();
      if (rep) {
        profile.stats.played = rep.played;
        profile.stats.wins = rep.wins;
        profile.stats.losses = rep.losses;
        profile.stats.abandoned = rep.abandoned;
        profile.stats.disputed = rep.disputed;
        profile.stats.winStreak = calculateWinStreak(rep);
        profile.stats.dailyWins = calculateDailyWins(rep);
      }
    } catch {
      // ignore
    }
  }

  if (realFeedbackMap) {
    profile.honorBadges = {
      friendly: realFeedbackMap['friendly'] ?? 0,
      sportive: realFeedbackMap['sportive'] ?? 0,
      great_player: realFeedbackMap['great_player'] ?? 0,
      strategist: realFeedbackMap['strategist'] ?? 0,
      punctual: realFeedbackMap['punctual'] ?? 0,
    };
  }

  return profile;
}

export async function fetchFriendsList(myGamertag?: string | null): Promise<FriendSummary[]> {
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends');
    if (!ok) {
      throw extractApiError(body, status, 'Impossibile caricare gli amici');
    }
    const data = mapFriendSummaryList(unwrapApiPayload<unknown>(body));
    if (!data) {
      throw new TournamentApiError('Risposta amici non valida', 502, 'INVALID_RESPONSE');
    }
    return data;
  } catch (err) {
    if (!canUseSocialMockForError(err)) throw err;
  }

  return fetchMockFriendsList(myGamertag);
}

export async function fetchFriendRequests(myGamertag?: string | null): Promise<FriendRequestItem[]> {
  try {
    const { ok, status, body } = await tournamentFetch('/api/v1/friends/requests');
    if (!ok) {
      throw extractApiError(body, status, 'Impossibile caricare le richieste');
    }
    const data = mapFriendRequestList(unwrapApiPayload<unknown>(body));
    if (!data) {
      throw new TournamentApiError('Risposta richieste non valida', 502, 'INVALID_RESPONSE');
    }
    return data;
  } catch (err) {
    if (!canUseSocialMockForError(err)) throw err;
  }

  return fetchMockFriendRequests(myGamertag);
}

export async function searchPlayers(query: string, myGamertag?: string | null): Promise<FriendSummary[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const { ok, status, body } = await tournamentFetch(`/api/v1/players/search?q=${encodeURIComponent(q)}`);
    if (!ok) {
      throw extractApiError(body, status, 'Impossibile cercare i giocatori');
    }
    const data = mapFriendSummaryList(unwrapApiPayload<unknown>(body));
    if (!data) {
      throw new TournamentApiError('Risposta ricerca non valida', 502, 'INVALID_RESPONSE');
    }
    return data;
  } catch (err) {
    if (!canUseSocialMockForError(err)) throw err;
  }

  return searchMockPlayers(q, myGamertag);
}
