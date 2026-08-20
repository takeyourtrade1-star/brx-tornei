import 'server-only';

import {
  getAvatarIdForGamertag,
  isMockBot,
  loadStateFromDisk,
  mockFriendsStore,
  mockRawRequests,
} from '@/lib/data/social-mock-store';
import type { FriendPresenceStatus, FriendRequestItem, FriendSummary } from '@/types/social';

export function fetchMockFriendsList(myGamertag?: string | null): FriendSummary[] {
  loadStateFromDisk();
  const key = myGamertag?.toLowerCase() ?? 'default';
  const friendTags = Array.from(mockFriendsStore.get(key) ?? []);
  return friendTags.map((tag, idx) => {
    const presenceList: FriendPresenceStatus[] = ['online', 'in_game', 'recent', 'offline'];
    const presence = presenceList[idx % presenceList.length] ?? 'offline';
    const statusText = presence === 'in_game'
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
      isBot: isMockBot(tag),
    };
  });
}

export function fetchMockFriendRequests(myGamertag?: string | null): FriendRequestItem[] {
  if (!myGamertag) return [];
  loadStateFromDisk();
  const myTagLower = myGamertag.toLowerCase();
  return mockRawRequests.flatMap((request) => {
    const incoming = request.recipientGamertag.toLowerCase() === myTagLower;
    const outgoing = request.senderGamertag.toLowerCase() === myTagLower;
    if (!incoming && !outgoing) return [];
    const gamertag = incoming ? request.senderGamertag : request.recipientGamertag;
    return [{
      id: request.id,
      gamertag,
      avatarId: getAvatarIdForGamertag(gamertag),
      createdAtText: 'Oggi',
      direction: incoming ? 'incoming' as const : 'outgoing' as const,
      isBot: isMockBot(gamertag),
    }];
  });
}

export function searchMockPlayers(query: string, myGamertag?: string | null): FriendSummary[] {
  loadStateFromDisk();
  const key = myGamertag?.toLowerCase() ?? 'default';
  const friends = Array.from(mockFriendsStore.get(key) ?? []);
  const basePool = [
    'Alex_TCG', 'Valerio_Magic', 'Sara_Draws', 'Kurogane', 'DeckMaster99',
    'BlackLotus_Fan', 'Chandra_Flame', 'Jace_Mind', 'Liliana_Dread',
  ];
  const qLower = query.toLowerCase();
  const matched = Array.from(new Set([...basePool, ...friends])).filter(
    (name) => name.toLowerCase().includes(qLower) && name.toLowerCase() !== myGamertag?.toLowerCase(),
  );
  if (
    query.length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(query) &&
    !matched.some((name) => name.toLowerCase() === qLower) &&
    qLower !== myGamertag?.toLowerCase()
  ) {
    matched.unshift(query);
  }
  return matched.slice(0, 10).map((tag, idx) => ({
    gamertag: tag,
    avatarId: getAvatarIdForGamertag(tag),
    presence: idx % 2 === 0 ? 'online' : 'recent',
    statusText: idx % 2 === 0 ? 'Online' : 'Attivo di recente',
    winStreak: 0,
    dailyWins: 0,
    isBot: isMockBot(tag),
  }));
}
