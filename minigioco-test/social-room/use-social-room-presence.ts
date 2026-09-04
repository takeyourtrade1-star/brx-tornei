"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChatEvent,
  createJoinEvent,
  createLeaveEvent,
  createMoveEvent,
  normalizeAvatarId,
  normalizeGamertag,
  normalizePosition,
  normalizeRoomId,
  parseSocialRoomEvent,
  sanitizeChatText,
  stableHash,
  type SocialRoomPlayer,
  type SocialRoomPosition,
} from "./social-room-protocol";
import {
  applyRemoteEvent,
  acknowledgeSelfChat,
  createSelfPlayer,
  nextSequence,
  sortPlayers,
  type SocialRoomPresenceApi,
  type UseSocialRoomPresenceOptions,
} from "./social-room-presence-model";
import {
  openSocialRoomSocket,
  type SocialRoomSocketSession,
} from "./social-room-websocket";
import { useSocialRoomExpiry } from "./use-social-room-expiry";

export type { SocialRoomPresenceApi, UseSocialRoomPresenceOptions } from "./social-room-presence-model";

/** Presenza Piazza autenticata: nessun seed finto e nessun token nel browser. */
export function useSocialRoomPresence(options: UseSocialRoomPresenceOptions): SocialRoomPresenceApi {
  const roomId = useMemo(() => normalizeRoomId(options.roomId), [options.roomId]);
  const gamertag = useMemo(() => normalizeGamertag(options.gamertag), [options.gamertag]);
  const avatarId = useMemo(() => normalizeAvatarId(options.avatarId), [options.avatarId]);
  const initialX = options.initialPosition?.x;
  const initialY = options.initialPosition?.y;
  const initialPosition = useMemo(() => (
    normalizePosition({ x: initialX, y: initialY }) ?? undefined
  ), [initialX, initialY]);
  const enabled = options.enabled !== false;
  const localPeerId = useMemo(() => `local-${stableHash(roomId)}`, [roomId]);
  const initialSelf = useMemo(
    () => createSelfPlayer(localPeerId, gamertag, avatarId, initialPosition),
    [localPeerId, gamertag, avatarId, initialPosition],
  );
  const [players, setPlayers] = useState<SocialRoomPlayer[]>([initialSelf]);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<SocialRoomSocketSession | null>(null);
  const peerIdRef = useRef(initialSelf.peerId);
  const gamertagRef = useRef(gamertag);
  const avatarIdRef = useRef(avatarId);
  const positionRef = useRef<SocialRoomPosition>(initialSelf.position);
  const sequenceRef = useRef(0);
  const activeRef = useRef(false);
  const seenSequencesRef = useRef(new Map<string, number>());
  const lastSeenRef = useRef(new Map<string, number>());
  const pendingChatsRef = useRef(new Map<number, string>());
  gamertagRef.current = gamertag;
  avatarIdRef.current = avatarId;

  useEffect(() => {
    const sessionSelf = createSelfPlayer(
      localPeerId,
      gamertagRef.current,
      avatarIdRef.current,
      initialPosition,
    );
    positionRef.current = sessionSelf.position;
    peerIdRef.current = sessionSelf.peerId;
    sequenceRef.current = 0;
    pendingChatsRef.current.clear();
    seenSequencesRef.current.clear();
    lastSeenRef.current.clear();
    setPlayers([sessionSelf]);
    setConnected(false);
    setConnectionError(null);
    activeRef.current = enabled;
    if (!enabled) return undefined;

    let session: SocialRoomSocketSession;
    const announce = (request: boolean, replyTo?: string): void => {
      session.send(createJoinEvent({
        roomId,
        peerId: peerIdRef.current,
        gamertag: gamertagRef.current,
        avatarId: avatarIdRef.current,
        position: positionRef.current,
        sequence: nextSequence(sequenceRef),
        request,
        replyTo,
      }));
    };

    session = openSocialRoomSocket({
      onAuthenticated(peerId) {
        peerIdRef.current = peerId;
        setPlayers((current) => sortPlayers(current.map((player) => (
          player.isSelf ? { ...player, peerId } : player
        ))));
        announce(true);
      },
      onEvent(value) {
        const event = parseSocialRoomEvent(value, roomId);
        if (!event || event.peerId === peerIdRef.current) return;
        const previous = seenSequencesRef.current.get(event.peerId) ?? 0;
        if (event.sequence <= previous) return;
        seenSequencesRef.current.set(event.peerId, event.sequence);
        lastSeenRef.current.set(event.peerId, Date.now());
        // La sequence resta come tombstone breve: un move in ritardo non ricrea l'amico.
        if (event.type === "join" && event.request) announce(false, event.peerId);
        setPlayers((current) => applyRemoteEvent(current, event, Date.now()));
      },
      onAcknowledgement(frame) {
        const text = pendingChatsRef.current.get(frame.clientSequence);
        if (!text) return;
        pendingChatsRef.current.delete(frame.clientSequence);
        if (!frame.accepted) {
          setConnectionError(frame.reason ?? "Messaggio non accettato dalla Piazza.");
          return;
        }
        setPlayers((current) => acknowledgeSelfChat(
          current,
          frame.clientSequence,
          text,
          Date.now(),
        ));
      },
      onState(isConnected, error) {
        setConnected(isConnected);
        setConnectionError(error);
        if (!isConnected) {
          pendingChatsRef.current.clear();
          seenSequencesRef.current.clear();
          lastSeenRef.current.clear();
          positionRef.current = initialSelf.position;
          setPlayers((current) => current
            .filter((player) => player.isSelf)
            .map((player) => ({ ...player, position: initialSelf.position })));
        }
      },
    });
    socketRef.current = session;

    return () => {
      if (activeRef.current) {
        session.send(createLeaveEvent({
          roomId,
          peerId: peerIdRef.current,
          sequence: nextSequence(sequenceRef),
        }));
      }
      activeRef.current = false;
      session.close();
      if (socketRef.current === session) socketRef.current = null;
    };
  }, [enabled, roomId, initialPosition, localPeerId]);

  useEffect(() => {
    setPlayers((current) => sortPlayers(current.map((player) => (
      player.isSelf ? { ...player, gamertag, avatarId } : player
    ))));
    if (!activeRef.current) return;
    socketRef.current?.send(createJoinEvent({
      roomId,
      peerId: peerIdRef.current,
      gamertag,
      avatarId,
      position: positionRef.current,
      sequence: nextSequence(sequenceRef),
      request: false,
    }));
  }, [roomId, gamertag, avatarId]);

  useSocialRoomExpiry(
    enabled,
    setPlayers,
    lastSeenRef.current,
    seenSequencesRef.current,
  );

  const sendMove = useCallback((value: unknown): boolean => {
    const position = normalizePosition(value);
    if (!position || !activeRef.current) return false;
    const sent = socketRef.current?.send(createMoveEvent({
      roomId,
      peerId: peerIdRef.current,
      gamertag: gamertagRef.current,
      avatarId: avatarIdRef.current,
      position,
      sequence: nextSequence(sequenceRef),
    })) ?? false;
    if (!sent) return false;
    positionRef.current = position;
    setPlayers((current) => sortPlayers(current.map((player) => (
      player.isSelf ? { ...player, position } : player
    ))));
    return true;
  }, [roomId]);

  const sendChat = useCallback((value: unknown): boolean => {
    const text = sanitizeChatText(value);
    if (!text || !activeRef.current) return false;
    const sequence = nextSequence(sequenceRef);
    const event = createChatEvent({
      roomId,
      peerId: peerIdRef.current,
      gamertag: gamertagRef.current,
      avatarId: avatarIdRef.current,
      text,
      sequence,
    });
    if (!event || !socketRef.current?.send(event)) return false;
    pendingChatsRef.current.set(sequence, event.text);
    return true;
  }, [roomId]);

  const removePlayer = useCallback((peerId: string): void => {
    if (!peerId || peerId === peerIdRef.current) return;
    setPlayers((current) => current.filter((player) => player.peerId !== peerId));
  }, []);

  const close = useCallback((): void => {
    activeRef.current = false;
    socketRef.current?.close();
    socketRef.current = null;
    setConnected(false);
    setPlayers((current) => current.filter((player) => player.isSelf));
  }, []);

  const self = players.find((player) => player.isSelf) ?? initialSelf;
  return {
    players,
    self,
    connected,
    transportMode: connected ? "websocket" : "unavailable",
    connectionError,
    sendMove,
    sendChat,
    removePlayer,
    close,
  };
}
