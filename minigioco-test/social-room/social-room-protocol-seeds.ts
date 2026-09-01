import {
  SOCIAL_ROOM_BOUNDS,
  type NormalizedSeedFriend,
  type SocialRoomFriendInput,
  type SocialRoomPosition,
  type SocialRoomPlayer,
} from "./social-room-protocol-types";
import {
  clampPosition,
  normalizeAvatarId,
  normalizeGamertag,
  normalizePosition,
  stableHash,
} from "./social-room-protocol-validation";

export function seedPeerId(roomId: string, friend: SocialRoomFriendInput, index: number): string {
  const identity = friend.id ?? friend.gamertag;
  return `seed-${stableHash(`${roomId}:${identity}:${index}`).toString(36)}`;
}

function defaultSeedPosition(roomId: string, gamertag: string, index: number): SocialRoomPosition {
  const hash = stableHash(`${roomId}:${gamertag}:${index}`);
  const width = SOCIAL_ROOM_BOUNDS.maxX - SOCIAL_ROOM_BOUNDS.minX - 2;
  const height = SOCIAL_ROOM_BOUNDS.maxY - SOCIAL_ROOM_BOUNDS.minY - 2;
  return {
    x: Math.round((SOCIAL_ROOM_BOUNDS.minX + 1 + (hash % 1000) / 1000 * width) * 100) / 100,
    y: Math.round((SOCIAL_ROOM_BOUNDS.minY + 1 + ((hash >>> 10) % 1000) / 1000 * height) * 100) / 100,
  };
}

function isOnlineFriend(candidate: Record<string, unknown>): boolean {
  if (candidate.online === false) return false;
  if (typeof candidate.presence !== "string" || !candidate.presence.trim()) return true;
  const presence = candidate.presence.trim().toLowerCase();
  return presence === "online" || presence === "in_game";
}

/** Gli amici iniziali sono demo/seed locali, non vengono spacciati per peer realtime. */
export function normalizeSeedFriends(
  value: unknown,
  roomId: string,
  selfGamertag: string,
): NormalizedSeedFriend[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: NormalizedSeedFriend[] = [];
  value.forEach((candidate, index) => {
    if (typeof candidate !== "object" || candidate === null || Array.isArray(candidate)) return;
    const record = candidate as Record<string, unknown>;
    if (!isOnlineFriend(record)) return;
    const gamertag = normalizeGamertag(record.gamertag);
    if (gamertag.toLowerCase() === selfGamertag.toLowerCase()) return;
    const avatarId = normalizeAvatarId(record.avatarId);
    const friend: SocialRoomFriendInput = {
      id: typeof record.id === "string" ? record.id : undefined,
      gamertag,
      avatarId,
      presence: typeof record.presence === "string" ? record.presence : undefined,
      position: normalizePosition(record.position) ?? undefined,
      idle: record.idle !== false,
    };
    const peerId = seedPeerId(roomId, friend, index);
    if (seen.has(peerId)) return;
    seen.add(peerId);
    const origin = friend.position ?? defaultSeedPosition(roomId, gamertag, index);
    result.push({
      origin,
      player: {
        peerId,
        gamertag,
        avatarId,
        position: origin,
        source: "seed-demo",
        isSelf: false,
        isSeed: true,
        idle: friend.idle !== false,
        bubble: null,
      },
    });
  });
  return result;
}

/** Movimento puramente cosmetico dei visitatori demo; non viene mai trasmesso. */
export function getDeterministicIdlePosition(
  peerId: string,
  origin: SocialRoomPosition,
  elapsedMs: number,
  bounds = SOCIAL_ROOM_BOUNDS,
): SocialRoomPosition {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const phase = (stableHash(peerId) % 628) / 100;
  const seconds = elapsed / 1000;
  return clampPosition(
    {
      x: origin.x + Math.sin(seconds / 2.8 + phase) * 0.65,
      y: origin.y + Math.cos(seconds / 3.4 + phase) * 0.4,
    },
    bounds,
  );
}
