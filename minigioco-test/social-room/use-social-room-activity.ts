"use client";

import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import {
  CHAT_BUBBLE_DURATION_MS,
  getDeterministicIdlePosition,
  type NormalizedSeedFriend,
  type SocialRoomPlayer,
  type SocialRoomPosition,
} from "./social-room-protocol";
import { sortPlayers } from "./social-room-presence-model";

interface SocialRoomActivityOptions {
  readonly enabled: boolean;
  readonly seedFriends: readonly NormalizedSeedFriend[];
  readonly setPlayers: Dispatch<SetStateAction<SocialRoomPlayer[]>>;
  readonly seedOriginsRef: MutableRefObject<Map<string, { origin: SocialRoomPosition; idle: boolean }>>;
  readonly idleStartedAtRef: MutableRefObject<number>;
}

export function useSocialRoomActivity({
  enabled,
  seedFriends,
  setPlayers,
  seedOriginsRef,
  idleStartedAtRef,
}: SocialRoomActivityOptions): void {
  useEffect(() => {
    if (!enabled || seedFriends.length === 0) return undefined;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - idleStartedAtRef.current;
      setPlayers((current) => {
        let changed = false;
        const next = current.map((player) => {
          if (player.source !== "seed-demo" || !player.idle) return player;
          const seed = seedOriginsRef.current.get(player.peerId);
          if (!seed) return player;
          const position = getDeterministicIdlePosition(player.peerId, seed.origin, elapsed);
          if (position.x === player.position.x && position.y === player.position.y) return player;
          changed = true;
          return { ...player, position };
        });
        return changed ? sortPlayers(next) : current;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [enabled, seedFriends, seedOriginsRef, idleStartedAtRef, setPlayers]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setPlayers((current) => {
        let changed = false;
        const next = current.map((player) => {
          if (!player.bubble || player.bubble.expiresAt > now) return player;
          changed = true;
          return { ...player, bubble: null };
        });
        return changed ? next : current;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [enabled, setPlayers]);
}
