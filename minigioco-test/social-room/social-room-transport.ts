import {
  normalizeRoomId,
  parseSocialRoomEvent,
  type SocialRoomEvent,
} from "./social-room-protocol";

export type SocialRoomTransportMode = "broadcast-channel" | "storage-event" | "unavailable";

export interface SocialRoomStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SocialRoomStorageEventLike {
  readonly key: string | null;
  readonly newValue: string | null;
  readonly storageArea?: SocialRoomStorageLike | null;
}

export interface SocialRoomBroadcastChannelLike {
  postMessage(message: unknown): void;
  addEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void;
  removeEventListener(type: "message", listener: (event: { readonly data: unknown }) => void): void;
  close(): void;
}

export type SocialRoomBroadcastChannelConstructor = new (
  name: string,
) => SocialRoomBroadcastChannelLike;

export interface SocialRoomWindowLike {
  readonly localStorage?: SocialRoomStorageLike | null;
  readonly BroadcastChannel?: SocialRoomBroadcastChannelConstructor;
  addEventListener(type: "storage", listener: (event: SocialRoomStorageEventLike) => void): void;
  removeEventListener(type: "storage", listener: (event: SocialRoomStorageEventLike) => void): void;
}

export interface SocialRoomTransport {
  readonly mode: SocialRoomTransportMode;
  post(event: SocialRoomEvent): boolean;
  subscribe(listener: (event: SocialRoomEvent) => void): () => void;
  close(): void;
}

export interface SocialRoomTransportOptions {
  readonly windowRef?: SocialRoomWindowLike | null;
  readonly storage?: SocialRoomStorageLike | null;
  readonly broadcastChannelConstructor?: SocialRoomBroadcastChannelConstructor | null;
}

const STORAGE_KEY_PREFIX = "ebartex-social-room-v1:";
const MAX_SERIALIZED_EVENT_LENGTH = 12_000;

export function getSocialRoomStorageKey(roomId: string): string {
  return `${STORAGE_KEY_PREFIX}${encodeURIComponent(normalizeRoomId(roomId))}`;
}

function getBrowserWindow(): SocialRoomWindowLike | null {
  return typeof window === "undefined" ? null : (window as unknown as SocialRoomWindowLike);
}

function getStorage(
  windowRef: SocialRoomWindowLike | null,
  providedStorage: SocialRoomStorageLike | null | undefined,
): SocialRoomStorageLike | null {
  const storage = providedStorage === undefined ? windowRef?.localStorage : providedStorage;
  if (!storage) return null;
  try {
    storage.getItem("__ebartex_social_room_probe__");
    return storage;
  } catch {
    return null;
  }
}

function getBroadcastChannelConstructor(
  windowRef: SocialRoomWindowLike | null,
  providedConstructor: SocialRoomBroadcastChannelConstructor | null | undefined,
): SocialRoomBroadcastChannelConstructor | null {
  if (providedConstructor !== undefined) return providedConstructor;
  return windowRef?.BroadcastChannel ?? null;
}

function createUnavailableTransport(): SocialRoomTransport {
  return {
    mode: "unavailable",
    post: () => false,
    subscribe: () => () => undefined,
    close: () => undefined,
  };
}

function createBroadcastTransport(
  roomId: string,
  Constructor: SocialRoomBroadcastChannelConstructor,
): SocialRoomTransport | null {
  let channel: SocialRoomBroadcastChannelLike;
  try {
    channel = new Constructor(`ebartex-social-room:${normalizeRoomId(roomId)}`);
  } catch {
    return null;
  }

  const listeners = new Set<(event: SocialRoomEvent) => void>();
  let closed = false;
  const onMessage = (message: { readonly data: unknown }): void => {
    const event = parseSocialRoomEvent(message.data, roomId);
    if (!event || closed) return;
    listeners.forEach((listener) => listener(event));
  };

  try {
    channel.addEventListener("message", onMessage);
  } catch {
    channel.close();
    return null;
  }

  return {
    mode: "broadcast-channel",
    post: (event) => {
      if (closed || !parseSocialRoomEvent(event, roomId)) return false;
      try {
        channel.postMessage(event);
        return true;
      } catch {
        return false;
      }
    },
    subscribe: (listener) => {
      if (closed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      if (closed) return;
      closed = true;
      listeners.clear();
      channel.removeEventListener("message", onMessage);
      channel.close();
    },
  };
}

function createStorageTransport(
  roomId: string,
  windowRef: SocialRoomWindowLike,
  storage: SocialRoomStorageLike,
): SocialRoomTransport | null {
  const key = getSocialRoomStorageKey(roomId);
  const listeners = new Set<(event: SocialRoomEvent) => void>();
  let closed = false;
  const onStorage = (storageEvent: SocialRoomStorageEventLike): void => {
    if (closed || storageEvent.key !== key || !storageEvent.newValue) return;
    if (storageEvent.storageArea && storageEvent.storageArea !== storage) return;
    try {
      const event = parseSocialRoomEvent(JSON.parse(storageEvent.newValue) as unknown, roomId);
      if (event) listeners.forEach((listener) => listener(event));
    } catch {
      // Un valore locale non valido non deve rompere il listener della pagina.
    }
  };

  try {
    windowRef.addEventListener("storage", onStorage);
  } catch {
    return null;
  }

  return {
    mode: "storage-event",
    post: (event) => {
      if (closed) return false;
      const safeEvent = parseSocialRoomEvent(event, roomId);
      if (!safeEvent) return false;
      try {
        const serialized = JSON.stringify(safeEvent);
        if (serialized.length > MAX_SERIALIZED_EVENT_LENGTH) return false;
        storage.setItem(key, serialized);
        return true;
      } catch {
        return false;
      }
    },
    subscribe: (listener) => {
      if (closed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      if (closed) return;
      closed = true;
      listeners.clear();
      windowRef.removeEventListener("storage", onStorage);
    },
  };
}

/** Preferisce BroadcastChannel e degrada a storage events senza toccare SSR. */
export function createSocialRoomTransport(
  roomId: string,
  options: SocialRoomTransportOptions = {},
): SocialRoomTransport {
  const windowRef = options.windowRef === undefined ? getBrowserWindow() : options.windowRef;
  if (!windowRef) return createUnavailableTransport();

  const Constructor = getBroadcastChannelConstructor(windowRef, options.broadcastChannelConstructor);
  if (Constructor) {
    const broadcastTransport = createBroadcastTransport(roomId, Constructor);
    if (broadcastTransport) return broadcastTransport;
  }

  const storage = getStorage(windowRef, options.storage);
  if (!storage) return createUnavailableTransport();
  return createStorageTransport(roomId, windowRef, storage) ?? createUnavailableTransport();
}
