"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CHAT_BUBBLE_DURATION_MS,
  createChatEvent,
  createJoinEvent,
  createLeaveEvent,
  createMoveEvent,
  createPeerId,
  normalizeAvatarId,
  normalizeGamertag,
  normalizePosition,
  normalizeRoomId,
  normalizeSeedFriends,
  stableHash,
  type SocialRoomEvent,
  type SocialRoomPlayer,
  type SocialRoomPosition,
} from "./social-room-protocol";
import {
  applyRemoteEvent,
  createInitialPlayers,
  createSelfPlayer,
  nextSequence,
  postOrMarkDisconnected,
  sortPlayers,
  type SocialRoomPresenceApi,
  type UseSocialRoomPresenceOptions,
} from "./social-room-presence-model";
import {
  createSocialRoomTransport,
  type SocialRoomTransport,
  type SocialRoomTransportMode,
} from "./social-room-transport";
import { useSocialRoomActivity } from "./use-social-room-activity";

export type { SocialRoomPresenceApi, UseSocialRoomPresenceOptions } from "./social-room-presence-model";

export function useSocialRoomPresence(
  options: UseSocialRoomPresenceOptions,
): SocialRoomPresenceApi {
  const roomId = useMemo(() => normalizeRoomId(options.roomId), [options.roomId]);
  const gamertag = useMemo(() => normalizeGamertag(options.gamertag), [options.gamertag]);
  const avatarId = useMemo(() => normalizeAvatarId(options.avatarId), [options.avatarId]);
  const enabled = options.enabled !== false;
  const seedFriends = useMemo(
    () => normalizeSeedFriends(options.initialFriends, roomId, gamertag),
    [options.initialFriends, roomId, gamertag],
  );
  const initialSelf = useMemo(
    () => createSelfPlayer(`ssr-${stableHash(`${roomId}:${gamertag}:${avatarId}`)}`, gamertag, avatarId),
    [roomId, gamertag, avatarId],
  );
  const [players, setPlayers] = useState<SocialRoomPlayer[]>(() => (
    createInitialPlayers(initialSelf, seedFriends)
  ));
  const [connected, setConnected] = useState(false);
  const [transportMode, setTransportMode] = useState<SocialRoomTransportMode>("unavailable");
  const transportRef = useRef<SocialRoomTransport | null>(null);
  const peerIdRef = useRef(initialSelf.peerId);
  const sequenceRef = useRef(0);
  const activeRef = useRef(false);
  const seenSequencesRef = useRef(new Map<string, number>());
  const seedOriginsRef = useRef(new Map<string, { origin: SocialRoomPosition; idle: boolean }>());
  const idleStartedAtRef = useRef(0);

  useSocialRoomActivity({ enabled, seedFriends, setPlayers, seedOriginsRef, idleStartedAtRef });

  useEffect(() => {
    if (!enabled) {
      activeRef.current = false;
      transportRef.current = null;
      setConnected(false);
      setTransportMode("unavailable");
      setPlayers(createInitialPlayers(initialSelf, seedFriends));
      return undefined;
    }

    const peerId = createPeerId();
    const self = createSelfPlayer(peerId, gamertag, avatarId);
    const initialPlayers = createInitialPlayers(self, seedFriends);
    peerIdRef.current = peerId;
    sequenceRef.current = 0;
    activeRef.current = true;
    seenSequencesRef.current.clear();
    seedOriginsRef.current = new Map(
      seedFriends.map((seed) => [seed.player.peerId, { origin: seed.origin, idle: seed.player.idle }]),
    );
    idleStartedAtRef.current = Date.now();
    setPlayers(initialPlayers);

    const transport = createSocialRoomTransport(roomId);
    transportRef.current = transport;
    setTransportMode(transport.mode);
    setConnected(transport.mode !== "unavailable");
    const post = (event: SocialRoomEvent): boolean => postOrMarkDisconnected(
      transport,
      event,
      setConnected,
      setTransportMode,
    );

    const onEvent = (event: SocialRoomEvent): void => {
      if (!activeRef.current || event.peerId === peerIdRef.current) return;
      const previousSequence = seenSequencesRef.current.get(event.peerId) ?? 0;
      if (event.sequence <= previousSequence) return;
      seenSequencesRef.current.set(event.peerId, event.sequence);
      if (event.type === "join" && event.request) {
        post(createJoinEvent({
          roomId,
          peerId,
          gamertag,
          avatarId,
          position: self.position,
          sequence: nextSequence(sequenceRef),
          request: false,
          replyTo: event.peerId,
        }));
      }
      setPlayers((current) => applyRemoteEvent(current, event, Date.now()));
    };

    const unsubscribe = transport.subscribe(onEvent);
    post(createJoinEvent({
      roomId,
      peerId,
      gamertag,
      avatarId,
      position: self.position,
      sequence: nextSequence(sequenceRef),
      request: true,
    }));

    return () => {
      activeRef.current = false;
      if (transportRef.current === transport) transportRef.current = null;
      if (transport.mode !== "unavailable") {
        transport.post(createLeaveEvent({
          roomId,
          peerId,
          sequence: nextSequence(sequenceRef),
        }));
      }
      unsubscribe();
      transport.close();
    };
  }, [enabled, roomId, gamertag, avatarId, seedFriends, initialSelf]);

  const sendMove = useCallback((value: unknown): boolean => {
    const position = normalizePosition(value);
    if (!position || !activeRef.current) return false;
    const peerId = peerIdRef.current;
    const event = createMoveEvent({
      roomId,
      peerId,
      gamertag,
      avatarId,
      position,
      sequence: nextSequence(sequenceRef),
    });
    setPlayers((current) => sortPlayers(current.map((player) => (
      player.peerId === peerId ? { ...player, position } : player
    ))));
    const transport = transportRef.current;
    if (transport && transport.mode !== "unavailable") postOrMarkDisconnected(
      transport,
      event,
      setConnected,
      setTransportMode,
    );
    return true;
  }, [roomId, gamertag, avatarId]);

  const sendChat = useCallback((value: unknown): boolean => {
    if (!activeRef.current || typeof value !== "string") return false;
    const peerId = peerIdRef.current;
    const event = createChatEvent({
      roomId,
      peerId,
      gamertag,
      avatarId,
      text: value,
      sequence: nextSequence(sequenceRef),
    });
    if (!event) return false;
    setPlayers((current) => sortPlayers(current.map((player) => (
      player.peerId === peerId
        ? {
            ...player,
            bubble: {
              id: `${peerId}:${event.sequence}`,
              text: event.text,
              expiresAt: Date.now() + CHAT_BUBBLE_DURATION_MS,
            },
          }
        : player
    ))));
    const transport = transportRef.current;
    if (transport && transport.mode !== "unavailable") postOrMarkDisconnected(
      transport,
      event,
      setConnected,
      setTransportMode,
    );
    return true;
  }, [roomId, gamertag, avatarId]);

  const removePlayer = useCallback((peerId: string): void => {
    if (!peerId || peerId === peerIdRef.current) return;
    setPlayers((current) => current.filter((player) => player.peerId !== peerId));
  }, []);

  const close = useCallback((): void => {
    if (!activeRef.current) return;
    activeRef.current = false;
    const transport = transportRef.current;
    const peerId = peerIdRef.current;
    if (transport) {
      if (transport.mode !== "unavailable") {
        transport.post(createLeaveEvent({ roomId, peerId, sequence: nextSequence(sequenceRef) }));
      }
      transport.close();
      transportRef.current = null;
    }
    setConnected(false);
    setTransportMode("unavailable");
    setPlayers((current) => sortPlayers(current.filter((player) => player.isSelf || player.isSeed)));
  }, [roomId]);

  const self = players.find((player) => player.isSelf) ?? initialSelf;
  return { players, self, connected, transportMode, sendMove, sendChat, removePlayer, close };
}
