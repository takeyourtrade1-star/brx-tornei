import { describe, expect, it } from 'vitest';
import {
  createChatEvent,
  createMoveEvent,
  type SocialRoomEvent,
} from '@/minigioco-test/social-room/social-room-protocol';
import {
  createSocialRoomTransport,
  getSocialRoomStorageKey,
  type SocialRoomBroadcastChannelLike,
  type SocialRoomStorageEventLike,
  type SocialRoomStorageLike,
  type SocialRoomWindowLike,
} from '@/minigioco-test/social-room/social-room-transport';

class FakeBroadcastChannel implements SocialRoomBroadcastChannelLike {
  private static readonly channels = new Map<string, Set<FakeBroadcastChannel>>();
  private readonly listeners = new Set<(event: { readonly data: unknown }) => void>();
  private closed = false;

  public constructor(private readonly name: string) {
    const channels = FakeBroadcastChannel.channels.get(name) ?? new Set<FakeBroadcastChannel>();
    channels.add(this);
    FakeBroadcastChannel.channels.set(name, channels);
  }

  public postMessage(message: unknown): void {
    if (this.closed) return;
    const channels = FakeBroadcastChannel.channels.get(this.name) ?? new Set<FakeBroadcastChannel>();
    channels.forEach((channel) => {
      if (channel !== this && !channel.closed) {
        channel.listeners.forEach((listener) => listener({ data: message }));
      }
    });
  }

  public addEventListener(
    type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ): void {
    if (type === 'message') this.listeners.add(listener);
  }

  public removeEventListener(
    type: 'message',
    listener: (event: { readonly data: unknown }) => void,
  ): void {
    if (type === 'message') this.listeners.delete(listener);
  }

  public close(): void {
    this.closed = true;
    FakeBroadcastChannel.channels.get(this.name)?.delete(this);
    this.listeners.clear();
  }
}

function createStorageHarness() {
  const values = new Map<string, string>();
  const listeners = new Set<(event: SocialRoomStorageEventLike) => void>();
  const storage: SocialRoomStorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const windowRef: SocialRoomWindowLike & {
    emitStorage: (event: SocialRoomStorageEventLike) => void;
  } = {
    addEventListener: (type, listener) => {
      if (type === 'storage') listeners.add(listener);
    },
    removeEventListener: (type, listener) => {
      if (type === 'storage') listeners.delete(listener);
    },
    emitStorage: (event) => listeners.forEach((listener) => listener(event)),
  };
  return { storage, windowRef, values };
}

function createChat(): SocialRoomEvent {
  const event = createChatEvent({
    roomId: 'social-room',
    peerId: 'tab-one',
    gamertag: 'Neko',
    avatarId: 'avatar-fox',
    text: 'Ciao dalla Piazza',
    sequence: 1,
    sentAt: 1,
  });
  if (!event) throw new Error('evento chat non creato');
  return event;
}

describe('trasporto locale Sala Piazza', () => {
  it('propaga movimento e chat tra due tab BroadcastChannel', () => {
    const windowRef: SocialRoomWindowLike = {
      BroadcastChannel: FakeBroadcastChannel,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
    const first = createSocialRoomTransport('social-room', {
      windowRef,
      broadcastChannelConstructor: FakeBroadcastChannel,
    });
    const second = createSocialRoomTransport('social-room', {
      windowRef,
      broadcastChannelConstructor: FakeBroadcastChannel,
    });
    const received: SocialRoomEvent[] = [];
    second.subscribe((event) => received.push(event));

    const move = createMoveEvent({
      roomId: 'social-room',
      peerId: 'tab-one',
      gamertag: 'Neko',
      avatarId: 'avatar-fox',
      position: { x: 2, y: 3 },
      sequence: 1,
      sentAt: 1,
    });
    expect(first.mode).toBe('broadcast-channel');
    expect(first.post(move)).toBe(true);
    expect(first.post({ ...move, roomId: 'other-room' })).toBe(false);
    expect(received).toEqual([move]);

    first.close();
    second.close();
  });

  it('usa storage events come fallback e scarta payload non validi', () => {
    const harness = createStorageHarness();
    const transport = createSocialRoomTransport('social-room', {
      windowRef: harness.windowRef,
      storage: harness.storage,
      broadcastChannelConstructor: null,
    });
    const received: SocialRoomEvent[] = [];
    transport.subscribe((event) => received.push(event));
    const event = createChat();
    const key = getSocialRoomStorageKey('social-room');

    expect(transport.mode).toBe('storage-event');
    expect(transport.post(event)).toBe(true);
    harness.windowRef.emitStorage({
      key,
      newValue: harness.values.get(key) ?? null,
      storageArea: harness.storage,
    });
    harness.windowRef.emitStorage({ key, newValue: '{"type":"spoof"}', storageArea: harness.storage });
    expect(received).toEqual([event]);
    transport.close();
  });
});
