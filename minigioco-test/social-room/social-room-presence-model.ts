import {
  CHAT_BUBBLE_DURATION_MS,
  SOCIAL_ROOM_SPAWN,
  type SocialRoomEvent,
  type SocialRoomPlayer,
  type SocialRoomPosition,
} from "./social-room-protocol";

export interface UseSocialRoomPresenceOptions {
  readonly roomId: string;
  readonly gamertag: string;
  readonly avatarId: string;
  readonly initialPosition?: SocialRoomPosition;
  readonly enabled?: boolean;
}

export interface SocialRoomPresenceApi {
  readonly players: SocialRoomPlayer[];
  readonly self: SocialRoomPlayer;
  readonly connected: boolean;
  readonly transportMode: "websocket" | "unavailable";
  readonly connectionError: string | null;
  readonly sendMove: (position: unknown) => boolean;
  readonly sendChat: (text: unknown) => boolean;
  readonly removePlayer: (peerId: string) => void;
  readonly close: () => void;
}

export function createSelfPlayer(
  peerId: string,
  gamertag: string,
  avatarId: string,
  position: SocialRoomPosition = SOCIAL_ROOM_SPAWN,
): SocialRoomPlayer {
  return {
    peerId,
    gamertag,
    avatarId,
    position,
    source: "self",
    isSelf: true,
    bubble: null,
    movementTrail: [],
  };
}

export function sortPlayers(players: SocialRoomPlayer[]): SocialRoomPlayer[] {
  return [...players].sort((left, right) => {
    if (left.isSelf !== right.isSelf) return left.isSelf ? -1 : 1;
    return left.peerId.localeCompare(right.peerId);
  });
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
  const previousTrail = existing?.movementTrail ?? [];
  const moved = event.type === "join" || event.type === "move";
  const movementTrail = moved && (
    !existing
    || existing.position.x !== event.position.x
    || existing.position.y !== event.position.y
  )
    ? [
        ...previousTrail,
        {
          sequence: event.sequence,
          position: event.position,
          reset: event.type === "join",
        },
      ].slice(-24)
    : previousTrail;
  return {
    peerId: event.peerId,
    gamertag: event.gamertag,
    avatarId: event.avatarId,
    position,
    source: "live-network",
    isSelf: false,
    bubble,
    movementTrail,
  };
}

export function applyRemoteEvent(
  players: SocialRoomPlayer[],
  event: SocialRoomEvent,
  now: number,
): SocialRoomPlayer[] {
  if (event.type === "leave") return sortPlayers(players.filter((player) => player.peerId !== event.peerId));

  const liveIndex = players.findIndex((player) => player.peerId === event.peerId);
  const existing = liveIndex >= 0 ? players[liveIndex] : undefined;
  const nextPlayer = playerFromEvent(event, existing, now);
  if (liveIndex >= 0) {
    return sortPlayers(players.map((player) => (
      player.peerId === event.peerId ? nextPlayer : player
    )));
  }
  return sortPlayers([...players, nextPlayer]);
}

export function nextSequence(sequenceRef: { current: number }): number {
  sequenceRef.current = Math.min(Number.MAX_SAFE_INTEGER, sequenceRef.current + 1);
  return sequenceRef.current;
}

export function acknowledgeSelfChat(
  players: SocialRoomPlayer[],
  sequence: number,
  text: string,
  now: number,
): SocialRoomPlayer[] {
  return sortPlayers(players.map((player) => (
    player.isSelf
      ? {
          ...player,
          bubble: {
            id: `${player.peerId}:${sequence}`,
            text,
            expiresAt: now + CHAT_BUBBLE_DURATION_MS,
          },
        }
      : player
  )));
}

export function pruneRemotePlayers(
  players: SocialRoomPlayer[],
  lastSeen: Map<string, number>,
  now: number,
  staleAfterMs: number,
): SocialRoomPlayer[] {
  let changed = false;
  const next = players.flatMap((player) => {
    if (!player.isSelf && (lastSeen.get(player.peerId) ?? 0) <= now - staleAfterMs) {
      lastSeen.delete(player.peerId);
      changed = true;
      return [];
    }
    if (!player.bubble || player.bubble.expiresAt > now) return [player];
    changed = true;
    return [{ ...player, bubble: null }];
  });
  return changed ? next : players;
}
