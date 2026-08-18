import 'server-only';

import { tournamentFetch } from '@/lib/data/tournament-api-client';
import { unwrapApiPayload } from '@/lib/data/tournament-mapper';
import { fetchMyMatchFeedback } from '@/lib/data/match-feedback';
import { fetchMyReputation } from '@/lib/data/player-api-client';
import { calculateDailyWins, calculateWinStreak } from '@/lib/rank';
import {
  buildFallbackPublicProfile,
  getAvatarIdForGamertag,
  mockFriendsStore,
  mockRequestsStore,
} from '@/lib/data/social-mock-store';
import type {
  FriendPresenceStatus,
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
} from './social-challenges-client';

export async function fetchPublicProfile(
  targetGamertag: string,
  myGamertag?: string | null,
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
    const { ok, body } = await tournamentFetch(
      `/api/v1/players/${encodeURIComponent(targetGamertag)}/public-profile`,
    );
    if (ok) {
      const data = unwrapApiPayload<PublicPlayerProfile>(body);
      if (data) {
        if (realFeedbackMap && data.honorBadges) {
          data.honorBadges = {
            friendly: realFeedbackMap['friendly'] ?? 0,
            sportive: realFeedbackMap['sportive'] ?? 0,
            great_player: realFeedbackMap['great_player'] ?? 0,
            strategist: realFeedbackMap['strategist'] ?? 0,
            punctual: realFeedbackMap['punctual'] ?? 0,
          };
        }
        return data;
      }
    }
  } catch {
    // Fallback a dati simulati
  }

  const profile = buildFallbackPublicProfile(targetGamertag, myGamertag);

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
    const { ok, body } = await tournamentFetch('/api/v1/friends');
    if (ok) {
      const data = unwrapApiPayload<FriendSummary[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  const friendTags = Array.from(mockFriendsStore.get('default') ?? []);
  return friendTags.map((tag, idx) => {
    const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
    const presence = presenceList[idx % presenceList.length];
    const statusText =
      presence === 'in_game'
        ? 'In partita'
        : presence === 'recent'
          ? 'Attivo di recente'
          : presence === 'offline'
            ? 'Non attivo di recente'
            : 'Nella Lobby';

    return {
      gamertag: tag,
      avatarId: getAvatarIdForGamertag(tag),
      presence,
      statusText,
      winStreak: 0,
      dailyWins: 0,
    };
  });
}

export async function fetchFriendRequests(): Promise<FriendRequestItem[]> {
  try {
    const { ok, body } = await tournamentFetch('/api/v1/friends/requests');
    if (ok) {
      const data = unwrapApiPayload<FriendRequestItem[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  return mockRequestsStore.get('default') ?? [];
}

export async function searchPlayers(query: string, myGamertag?: string | null): Promise<FriendSummary[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const { ok, body } = await tournamentFetch(`/api/v1/players/search?q=${encodeURIComponent(q)}`);
    if (ok) {
      const data = unwrapApiPayload<FriendSummary[]>(body);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // Fallback mock
  }

  const basePool = [
    'Alex_TCG',
    'Valerio_Magic',
    'Sara_Draws',
    'Kurogane',
    'DeckMaster99',
    'BlackLotus_Fan',
    'Chandra_Flame',
    'Jace_Mind',
    'Liliana_Dread',
  ];

  const friends = Array.from(mockFriendsStore.get('default') ?? []);
  const allKnown = Array.from(new Set([...basePool, ...friends]));

  const qLower = q.toLowerCase();
  const matched = allKnown.filter(
    (name) => name.toLowerCase().includes(qLower) && name.toLowerCase() !== myGamertag?.toLowerCase(),
  );

  if (
    q.length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(q) &&
    !matched.some((m) => m.toLowerCase() === qLower) &&
    qLower !== myGamertag?.toLowerCase()
  ) {
    matched.unshift(q);
  }

  return matched.slice(0, 10).map((tag, idx) => ({
    gamertag: tag,
    avatarId: getAvatarIdForGamertag(tag),
    presence: (idx % 2 === 0 ? 'online' : 'recent') as FriendPresenceStatus,
    statusText: idx % 2 === 0 ? 'Online' : 'Attivo di recente',
    winStreak: 0,
    dailyWins: 0,
  }));
}
