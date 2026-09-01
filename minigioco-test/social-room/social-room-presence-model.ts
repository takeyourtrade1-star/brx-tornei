import {
  CHAT_BUBBLE_DURATION_MS,
  SOCIAL_ROOM_SPAWN,
  type SocialRoomEvent,
  type SocialRoomPlayer,
  type SocialRoomPosition,
} from "./social-room-protocol";
import type {
  SocialRoomTransport,
  SocialRoomTransportMode,
} from "./social-room-transport";

export interface UseSocialRoomPresenceOptions {
  readonly roomId: string;
  readonly gamertag: string;
  readonly avatarId: string;
  readonly initialFriends?: readonly unknown[];
  readonly enabled?: boolean;
}

export interface SocialRoomPresenceApi {
  readonly players: SocialRoomPlayer[];
  readonly self: SocialRoomPlayer;
  readonly connected: boolean;
  readonly transportMode: SocialRoomTransportMode;
  readonly sendMove: (position: unknown) => boolean;
  readonly sendChat: (text: unknown) => boolean;
  readonly removePlayer: (peerId: string) => void;
  readonly close: () => void;
}

export function createSelfPlayer(peerId: string, gamertag: string, avatarId: string): SocialRoomPlayer {
  return {
    peerId,
    gamertag,
    avatarId,
    position: SOCIAL_ROOM_SPAWN,
    source: "self",
    isSelf: true,
    isSeed: false,
    idle: false,
    bubble: null,
  };
}

export function sortPlayers(players: SocialRoomPlayer[]): SocialRoomPlayer[] {
  return [...players].sort((left, right) => {
    if (left.isSelf !== right.isSelf) return left.isSelf ? -1 : 1;
    if (left.source !== right.source) return left.source === "live-tab" ? -1 : 1;
    return left.peerId.localeCompare(right.peerId);
  });
}

export function createInitialPlayers(
  self: SocialRoomPlayer,
  seeds: readonly { readonly player: SocialRoomPlayer }[],
): SocialRoomPlayer[] {
  return sortPlayers([self, ...seeds.map((seed) => seed.player)]);
}

function playerFromEvent(
  event: Exclude<SocialRoomEvent, { type: "leave" }>,
  existing: SocialRoomPlayer | undefined,
  now: number,
): SocialRoomPlayer {
  const position = event.type === "chat" ? existing?.position ?? SOCIAL_ROOM_SPAWN : event.position;
  const bubble = event.type === "chat"
    ? { id: `${event.peerId}:${event.sequence}`, text: event.text, expiresAt: now + CHAT_BUBBLE_DURATION_MS }
    : existing?.bubble ?? null;
  return {
    peerId: event.peerId,
    gamertag: event.gamertag,
    avatarId: event.avatarId,
    position,
    source: "live-tab",
    isSelf: false,
    isSeed: false,
    idle: false,
    bubble,
  };
}

export function applyRemoteEvent(
  players: SocialRoomPlayer[],
  event: SocialRoomEvent,
  now: number,
): SocialRoomPlayer[] {
  if (event.type === "leave") return sortPlayers(players.filter((player) => player.peerId !== event.peerId));

  const liveIndex = players.findIndex((player) => player.peerId === event.peerId);
  const seedIndex = players.findIndex(
    (player) => player.isSeed && player.gamertag === event.gamertag,
  );
  const existing = liveIndex >= 0 ? players[liveIndex] : undefined;
  const nextPlayer = playerFromEvent(event, existing, now);
  const withoutSeed = seedIndex >= 0 && liveIndex < 0
    ? players.filter((_, index) => index !== seedIndex)
    : players;
  if (liveIndex >= 0) {
    return sortPlayers(withoutSeed.map((player) => (
      player.peerId === event.peerId ? nextPlayer : player
    )));
  }
  return sortPlayers([...withoutSeed, nextPlayer]);
}

export function nextSequence(sequenceRef: { current: number }): number {
  sequenceRef.current = Math.min(Number.MAX_SAFE_INTEGER, sequenceRef.current + 1);
  return sequenceRef.current;
}

export function postOrMarkDisconnected(
  transport: SocialRoomTransport,
  event: SocialRoomEvent,
  setConnected: (connected: boolean) => void,
  setTransportMode: (mode: SocialRoomTransportMode) => void,
): boolean {
  const posted = transport.post(event);
  if (!posted) {
    setConnected(false);
    setTransportMode(transport.mode);
  }
  return posted;
}
