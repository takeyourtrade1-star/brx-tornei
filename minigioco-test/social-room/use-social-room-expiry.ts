"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { SocialRoomPlayer } from "./social-room-protocol";
import { pruneRemotePlayers } from "./social-room-presence-model";

const REMOTE_STALE_MS = 45_000;

export function useSocialRoomExpiry(
  enabled: boolean,
  setPlayers: Dispatch<SetStateAction<SocialRoomPlayer[]>>,
  lastSeen: Map<string, number>,
  seenSequences: Map<string, number>,
): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setPlayers((current) => {
        const next = pruneRemotePlayers(current, lastSeen, now, REMOTE_STALE_MS);
        const liveIds = new Set(next.map((player) => player.peerId));
        for (const peerId of seenSequences.keys()) {
          if (!liveIds.has(peerId) && (lastSeen.get(peerId) ?? 0) <= now - REMOTE_STALE_MS) {
            seenSequences.delete(peerId);
            lastSeen.delete(peerId);
          }
        }
        return next;
      });
    }, 350);
    return () => window.clearInterval(timer);
  }, [enabled, lastSeen, seenSequences, setPlayers]);
}
