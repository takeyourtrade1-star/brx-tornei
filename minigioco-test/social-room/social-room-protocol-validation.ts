import {
  DEFAULT_SOCIAL_ROOM_ID,
  SOCIAL_ROOM_BOUNDS,
  type SocialRoomBounds,
  type SocialRoomPosition,
} from "./social-room-protocol-types";

const MAX_ROOM_ID_LENGTH = 80;
const MAX_PEER_ID_LENGTH = 96;
const MAX_GAMERTAG_LENGTH = 32;
const MAX_AVATAR_ID_LENGTH = 48;
const MAX_TIMESTAMP = 9_007_199_254_740_991;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/gu;
const DIRECTIONAL_MARKS = /[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/gu;
const ROOM_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/i;
const PEER_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/i;
const AVATAR_ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/i;
const GAMERTAG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _.:-]*$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function normalizeLabel(value: unknown, maxLength: number, pattern: RegExp): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.normalize("NFKC").replace(CONTROL_CHARACTERS, " ").trim();
  if (!normalized || codePointLength(normalized) > maxLength || !pattern.test(normalized)) return null;
  return normalized;
}

export function normalizeRoomId(value: unknown): string {
  return normalizeLabel(value, MAX_ROOM_ID_LENGTH, ROOM_ID_PATTERN) ?? DEFAULT_SOCIAL_ROOM_ID;
}

export function normalizeGamertag(value: unknown): string {
  return normalizeLabel(value, MAX_GAMERTAG_LENGTH, GAMERTAG_PATTERN) ?? "Giocatore";
}

export function normalizeAvatarId(value: unknown): string {
  return normalizeLabel(value, MAX_AVATAR_ID_LENGTH, AVATAR_ID_PATTERN) ?? "avatar-default";
}

export function normalizePeerId(value: unknown): string | null {
  return normalizeLabel(value, MAX_PEER_ID_LENGTH, PEER_ID_PATTERN);
}

/** Testo mostrabile come nodo testuale React: niente markup interpretato. */
export function sanitizeChatText(value: unknown): string {
  if (typeof value !== "string") return "";
  const sanitized = value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, " ")
    .replace(DIRECTIONAL_MARKS, "")
    .replace(/[<>]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return Array.from(sanitized).slice(0, 160).join("").trimEnd();
}

export function clampPosition(
  position: SocialRoomPosition,
  bounds: SocialRoomBounds = SOCIAL_ROOM_BOUNDS,
): SocialRoomPosition {
  return {
    x: Math.round(Math.min(bounds.maxX, Math.max(bounds.minX, position.x))),
    y: Math.round(Math.min(bounds.maxY, Math.max(bounds.minY, position.y))),
  };
}

/** Accetta soltanto caselle intere già comprese nel rettangolo della stanza. */
export function normalizePosition(
  value: unknown,
  bounds: SocialRoomBounds = SOCIAL_ROOM_BOUNDS,
): SocialRoomPosition | null {
  if (!isRecord(value) || typeof value.x !== "number" || typeof value.y !== "number") return null;
  if (!Number.isSafeInteger(value.x) || !Number.isSafeInteger(value.y)) return null;
  if (value.x < bounds.minX || value.x > bounds.maxX) return null;
  if (value.y < bounds.minY || value.y > bounds.maxY) return null;
  return { x: value.x, y: value.y };
}

export function stableHash(value: string): number {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function createPeerId(): string {
  const cryptoObject = globalThis.crypto;
  const randomUuid = typeof cryptoObject?.randomUUID === "function" ? cryptoObject.randomUUID() : null;
  const entropy = randomUuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `tab-${entropy}`;
}
