'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import {
  encodeMatchStartCommand,
  MATCH_START_COUNTDOWN_MS,
  parseMatchStartCommand,
} from '@/lib/match-start-protocol';
import { synchronizedRemainingMs } from '@/lib/synchronized-deadline';

const STORAGE_PREFIX = 'match-start:';

function readStoredStartsAt(matchId: string): number {
  try {
    return Number(window.localStorage.getItem(`${STORAGE_PREFIX}${matchId}`));
  } catch {
    return 0;
  }
}

function writeStoredStartsAt(matchId: string, value: number): void {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${matchId}`, String(value));
  } catch {
    /* storage pieno o privacy: non bloccare il match */
  }
}

interface UseMatchStartCountdownOptions {
  active: boolean;
  matchId?: string | null;
  userId: string;
  authorityPlayerId: string;
  connected: boolean;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
  authoritativeStartsAt?: string;
  serverTime?: string;
}

export function useMatchStartCountdown({
  active,
  matchId,
  userId,
  authorityPlayerId,
  connected,
  messages,
  send,
  authoritativeStartsAt,
  serverTime,
}: UseMatchStartCountdownOptions) {
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const processedMessages = useRef(new Set<string>());
  const skipStaleMessages = useRef(true);
  const announcedForMatch = useRef<string | null>(null);
  const requestedForMatch = useRef<string | null>(null);
  const authoritativeRemainingMs = useMemo(
    () => synchronizedRemainingMs(authoritativeStartsAt, serverTime),
    [authoritativeStartsAt, serverTime],
  );
  const hasAuthoritativeStart = authoritativeRemainingMs !== null;

  useEffect(() => {
    setStartsAt(null);
    setNow(Date.now());
    processedMessages.current.clear();
    skipStaleMessages.current = true;
    announcedForMatch.current = null;
    requestedForMatch.current = null;
  }, [active, matchId]);

  useEffect(() => {
    if (!active || !matchId || authoritativeRemainingMs === null) return;
    const localDeadline = Date.now() + authoritativeRemainingMs;
    setStartsAt(localDeadline);
    writeStoredStartsAt(matchId, localDeadline);
  }, [active, authoritativeRemainingMs, matchId]);

  useEffect(() => {
    if (!active || !matchId || hasAuthoritativeStart || startsAt !== null) return;
    const stored = readStoredStartsAt(matchId);
    const synchronizationGraceMs = userId === authorityPlayerId ? 0 : 1_000;
    const nextStartsAt =
      stored > 0 ? stored : Date.now() + MATCH_START_COUNTDOWN_MS + synchronizationGraceMs;
    setStartsAt(nextStartsAt);
    writeStoredStartsAt(matchId, nextStartsAt);
  }, [active, authorityPlayerId, hasAuthoritativeStart, matchId, startsAt, userId]);

  useEffect(() => {
    if (connected) return;
    announcedForMatch.current = null;
    requestedForMatch.current = null;
  }, [connected]);

  useEffect(() => {
    if (!active || startsAt === null) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(timer);
  }, [active, startsAt]);

  useEffect(() => {
    if (hasAuthoritativeStart) return;
    if (skipStaleMessages.current) {
      skipStaleMessages.current = false;
      return;
    }
    for (const message of messages) {
      if (processedMessages.current.has(message.id)) continue;
      processedMessages.current.add(message.id);
      const command = parseMatchStartCommand(message.text);
      if (!command || command.senderId !== message.userId) continue;

      if (command.type === 'announce' && message.userId === authorityPlayerId) {
        setStartsAt(command.startsAt);
        if (matchId) writeStoredStartsAt(matchId, command.startsAt);
      } else if (
        command.type === 'sync-request' &&
        userId === authorityPlayerId &&
        command.senderId !== userId &&
        startsAt !== null
      ) {
        send(encodeMatchStartCommand({ type: 'announce', startsAt, senderId: userId }));
      }
    }
  }, [authorityPlayerId, hasAuthoritativeStart, matchId, messages, send, startsAt, userId]);

  useEffect(() => {
    if (
      !active ||
      hasAuthoritativeStart ||
      !connected ||
      !matchId ||
      startsAt === null ||
      userId !== authorityPlayerId ||
      announcedForMatch.current === matchId
    ) {
      return;
    }
    const sent = send(encodeMatchStartCommand({ type: 'announce', startsAt, senderId: userId }));
    if (sent) announcedForMatch.current = matchId;
  }, [active, authorityPlayerId, connected, hasAuthoritativeStart, matchId, send, startsAt, userId]);

  useEffect(() => {
    if (
      !active ||
      hasAuthoritativeStart ||
      !connected ||
      !matchId ||
      userId === authorityPlayerId ||
      requestedForMatch.current === matchId
    ) {
      return;
    }
    const sent = send(encodeMatchStartCommand({ type: 'sync-request', senderId: userId }));
    if (sent) requestedForMatch.current = matchId;
  }, [active, authorityPlayerId, connected, hasAuthoritativeStart, matchId, send, userId]);

  const remainingSeconds = useMemo(() => {
    if (!active || startsAt === null) return null;
    return Math.max(0, Math.ceil((startsAt - now) / 1_000));
  }, [active, now, startsAt]);

  return {
    remainingSeconds,
    readyToPlay: active && remainingSeconds === 0,
  };
}
