export const SOCIAL_ROOM_PROTOCOL_VERSION = 1 as const;
export const DEFAULT_SOCIAL_ROOM_ID = "social-room";
export const MAX_CHAT_LENGTH = 160;
export const CHAT_BUBBLE_DURATION_MS = 4_500;

export interface SocialRoomBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface SocialRoomPosition {
  readonly x: number;
  readonly y: number;
}

export const SOCIAL_ROOM_BOUNDS: SocialRoomBounds = Object.freeze({
  minX: 0,
  maxX: 12,
  minY: 0,
  maxY: 10,
});

export const SOCIAL_ROOM_SPAWN: SocialRoomPosition = Object.freeze({ x: 6, y: 5 });

export type SocialRoomPlayerSource = "self" | "live-tab" | "seed-demo";

export interface SocialRoomBubble {
  readonly id: string;
  readonly text: string;
  readonly expiresAt: number;
}

export interface SocialRoomPlayer {
  readonly peerId: string;
  readonly gamertag: string;
  readonly avatarId: string;
  readonly position: SocialRoomPosition;
  readonly source: SocialRoomPlayerSource;
  readonly isSelf: boolean;
  readonly isSeed: boolean;
  readonly idle: boolean;
  readonly bubble: SocialRoomBubble | null;
}

export interface SocialRoomFriendInput {
  readonly id?: string;
  readonly gamertag: string;
  readonly avatarId?: string;
  readonly presence?: string;
  readonly position?: SocialRoomPosition;
  readonly idle?: boolean;
}

export interface SocialRoomEventBase {
  readonly version: typeof SOCIAL_ROOM_PROTOCOL_VERSION;
  readonly roomId: string;
  readonly peerId: string;
  readonly sequence: number;
  readonly sentAt: number;
}

export interface SocialRoomJoinEvent extends SocialRoomEventBase {
  readonly type: "join";
  readonly gamertag: string;
  readonly avatarId: string;
  readonly position: SocialRoomPosition;
  readonly request: boolean;
  readonly replyTo?: string;
}

export interface SocialRoomLeaveEvent extends SocialRoomEventBase {
  readonly type: "leave";
}

export interface SocialRoomMoveEvent extends SocialRoomEventBase {
  readonly type: "move";
  readonly gamertag: string;
  readonly avatarId: string;
  readonly position: SocialRoomPosition;
}

export interface SocialRoomChatEvent extends SocialRoomEventBase {
  readonly type: "chat";
  readonly gamertag: string;
  readonly avatarId: string;
  readonly text: string;
}

export type SocialRoomEvent =
  | SocialRoomJoinEvent
  | SocialRoomLeaveEvent
  | SocialRoomMoveEvent
  | SocialRoomChatEvent;

export interface NormalizedSeedFriend {
  readonly player: SocialRoomPlayer;
  readonly origin: SocialRoomPosition;
}
