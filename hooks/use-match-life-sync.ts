'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { encodeMatchLifeCommand } from '@/lib/match-life-protocol';
import { nextLifeCommandId } from './match-life-state';

interface LifeSyncOptions {
  matchId?: string | null;
  userId: string;
  authorityPlayerId: string;
  playerIds: string[];
  connected: boolean;
  send: (text: string) => boolean;
  stateRef: MutableRefObject<{ revision: number }>;
  commandSequence: MutableRefObject<number>;
}

/** Ritenta finché l'host risponde; nessun timer sopravvive alla connessione. */
export function useMatchLifeSync({
  matchId, userId, authorityPlayerId, playerIds, connected, send, stateRef, commandSequence,
}: LifeSyncOptions) {
  const scope = JSON.stringify([matchId, userId, authorityPlayerId, playerIds]);
  const [syncedScope, setSyncedScope] = useState<string | null>(null);
  const awaitingSnapshot = useRef(false);
  const requests = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSyncedScope(null);
    requests.current.clear();
    awaitingSnapshot.current = false;
    if (!connected || !matchId || userId === authorityPlayerId) return;

    awaitingSnapshot.current = true;
    let delay = 1_000;
    const request = () => {
      if (!awaitingSnapshot.current) return;
      const commandId = nextLifeCommandId(commandSequence, userId);
      requests.current.add(commandId);
      const sent = send(encodeMatchLifeCommand({
        type: 'sync-request', senderId: userId, revision: stateRef.current.revision, commandId,
      }));
      if (!sent) requests.current.delete(commandId);
      if (requests.current.size > 16) requests.current.delete(requests.current.values().next().value!);
      if (awaitingSnapshot.current) {
        timer.current = setTimeout(request, delay);
        delay = Math.min(delay * 2, 5_000);
      }
    };
    request();
    return () => {
      awaitingSnapshot.current = false;
      requests.current.clear();
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [authorityPlayerId, commandSequence, connected, matchId, scope, send, stateRef, userId]);

  const complete = useCallback((requestId?: string) => {
    if (!awaitingSnapshot.current || (requestId && !requests.current.has(requestId))) return false;
    // I client V1 già aperti possono rispondere senza requestId.
    awaitingSnapshot.current = false;
    requests.current.clear();
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setSyncedScope(scope);
    return true;
  }, [scope]);

  return { synced: userId === authorityPlayerId || (connected && syncedScope === scope), complete };
}
