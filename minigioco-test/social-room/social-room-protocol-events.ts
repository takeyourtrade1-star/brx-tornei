import {
  SOCIAL_ROOM_PROTOCOL_VERSION,
  SOCIAL_ROOM_SPAWN,
  type SocialRoomChatEvent,
  type SocialRoomEvent,
  type SocialRoomEventBase,
  type SocialRoomJoinEvent,
  type SocialRoomLeaveEvent,
  type SocialRoomMoveEvent,
  type SocialRoomPosition,
} from "./social-room-protocol-types";
import {
  normalizeAvatarId,
  normalizeGamertag,
  normalizePeerId,
  normalizePosition,
  normalizeRoomId,
  sanitizeChatText,
} from "./social-room-protocol-validation";

function makeBase<T extends SocialRoomEvent["type"]>(
  type: T,
  roomId: string,
  peerId: string,
  sequence: number,
  sentAt: number,
): SocialRoomEventBase & { readonly type: T } {
  return {
    version: SOCIAL_ROOM_PROTOCOL_VERSION,
    type,
    roomId: normalizeRoomId(roomId),
    peerId: normalizePeerId(peerId) ?? "tab-invalid",
    sequence: Number.isSafeInteger(sequence) && sequence > 0 ? sequence : 1,
    sentAt: Number.isSafeInteger(sentAt) && sentAt >= 0 ? sentAt : Date.now(),
  };
}

export function createJoinEvent(input: {
  roomId: string;
  peerId: string;
  gamertag: string;
  avatarId: string;
  position: SocialRoomPosition;
  sequence: number;
  request: boolean;
  replyTo?: string;
  sentAt?: number;
}): SocialRoomJoinEvent {
  return {
    ...makeBase("join", input.roomId, input.peerId, input.sequence, input.sentAt ?? Date.now()),
    gamertag: normalizeGamertag(input.gamertag),
    avatarId: normalizeAvatarId(input.avatarId),
    position: normalizePosition(input.position) ?? SOCIAL_ROOM_SPAWN,
    request: input.request,
    ...(input.replyTo ? { replyTo: normalizePeerId(input.replyTo) ?? undefined } : {}),
  };
}

export function createLeaveEvent(input: {
  roomId: string;
  peerId: string;
  sequence: number;
  sentAt?: number;
}): SocialRoomLeaveEvent {
  return makeBase("leave", input.roomId, input.peerId, input.sequence, input.sentAt ?? Date.now());
}

export function createMoveEvent(input: {
  roomId: string;
  peerId: string;
  gamertag: string;
  avatarId: string;
  position: SocialRoomPosition;
  sequence: number;
  sentAt?: number;
}): SocialRoomMoveEvent {
  return {
    ...makeBase("move", input.roomId, input.peerId, input.sequence, input.sentAt ?? Date.now()),
    gamertag: normalizeGamertag(input.gamertag),
    avatarId: normalizeAvatarId(input.avatarId),
    position: normalizePosition(input.position) ?? SOCIAL_ROOM_SPAWN,
  };
}

export function createChatEvent(input: {
  roomId: string;
  peerId: string;
  gamertag: string;
  avatarId: string;
  text: string;
  sequence: number;
  sentAt?: number;
}): SocialRoomChatEvent | null {
  const text = sanitizeChatText(input.text);
  if (!text) return null;
  return {
    ...makeBase("chat", input.roomId, input.peerId, input.sequence, input.sentAt ?? Date.now()),
    gamertag: normalizeGamertag(input.gamertag),
    avatarId: normalizeAvatarId(input.avatarId),
    text,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readBase(value: Record<string, unknown>, expectedRoomId?: string): SocialRoomEventBase | null {
  if (value.version !== SOCIAL_ROOM_PROTOCOL_VERSION) return null;
  const roomId = normalizeRoomId(value.roomId);
  const peerId = normalizePeerId(value.peerId);
  if (
    typeof value.roomId !== "string" || roomId !== value.roomId.trim() || !peerId
    || (expectedRoomId !== undefined && roomId !== normalizeRoomId(expectedRoomId))
    || typeof value.sequence !== "number" || !Number.isSafeInteger(value.sequence) || value.sequence < 1
    || typeof value.sentAt !== "number" || !Number.isSafeInteger(value.sentAt) || value.sentAt < 0
  ) return null;
  return {
    version: SOCIAL_ROOM_PROTOCOL_VERSION,
    roomId,
    peerId,
    sequence: value.sequence,
    sentAt: value.sentAt,
  };
}

function readParticipant(value: Record<string, unknown>): { gamertag: string; avatarId: string } | null {
  const gamertag = normalizeGamertag(value.gamertag);
  const avatarId = normalizeAvatarId(value.avatarId);
  if (typeof value.gamertag !== "string" || gamertag !== value.gamertag.trim()) return null;
  if (typeof value.avatarId !== "string" || avatarId !== value.avatarId.trim()) return null;
  return { gamertag, avatarId };
}

/** Parser unico per BroadcastChannel e storage: scarta dati estranei o malformati. */
export function parseSocialRoomEvent(value: unknown, expectedRoomId?: string): SocialRoomEvent | null {
  if (!isRecord(value) || typeof value.type !== "string") return null;
  const base = readBase(value, expectedRoomId);
  if (!base) return null;
  switch (value.type) {
    case "leave":
      return { ...base, type: "leave" };
    case "join": {
      const participant = readParticipant(value);
      const position = normalizePosition(value.position);
      const replyTo = value.replyTo === undefined ? undefined : normalizePeerId(value.replyTo);
      if (!participant || !position || typeof value.request !== "boolean") return null;
      if (value.replyTo !== undefined && !replyTo) return null;
      return { ...base, type: "join", ...participant, position, request: value.request, ...(replyTo ? { replyTo } : {}) };
    }
    case "move": {
      const participant = readParticipant(value);
      const position = normalizePosition(value.position);
      return participant && position ? { ...base, type: "move", ...participant, position } : null;
    }
    case "chat": {
      const participant = readParticipant(value);
      const text = sanitizeChatText(value.text);
      return participant && text ? { ...base, type: "chat", ...participant, text } : null;
    }
    default:
      return null;
  }
}

export function isSocialRoomEvent(value: unknown, expectedRoomId?: string): value is SocialRoomEvent {
  return parseSocialRoomEvent(value, expectedRoomId) !== null;
}
