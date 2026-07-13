'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import {
  encodeMatchStartCommand,
  MATCH_START_COUNTDOWN_MS,
  parseMatchStartCommand,
} from '@/lib/match-start-protocol';

interface UseMatchStartCountdownOptions {
  active: boolean;
  matchId?: string | null;
  userId: string;
  authorityPlayerId: string;
  connected: boolean;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
}

export function useMatchStartCountdown({
  active,
  matchId,
  userId,
  authorityPlayerId,
  connected,
  messages,
  send,
}: UseMatchStartCountdownOptions) {
  const [startsAt, setStartsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const processedMessages = useRef(new Set<string>());
  const announcedForMatch = useRef<string | null>(null);
  const requestedForMatch = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !matchId || startsAt !== null) return;
    const storageKey = `match-start:${matchId}`;
    const stored = Number(window.sessionStorage.getItem(storageKey));
    const synchronizationGraceMs = userId === authorityPlayerId ? 0 : 1_000;
    const nextStartsAt =
      stored > 0 ? stored : Date.now() + MATCH_START_COUNTDOWN_MS + synchronizationGraceMs;
    setStartsAt(nextStartsAt);
    window.sessionStorage.setItem(storageKey, String(nextStartsAt));
  }, [active, authorityPlayerId, matchId, startsAt, userId]);

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
    for (const message of messages) {
      if (processedMessages.current.has(message.id)) continue;
      processedMessages.current.add(message.id);
      const command = parseMatchStartCommand(message.text);
      if (!command || command.senderId !== message.userId) continue;

      if (command.type === 'announce' && message.userId === authorityPlayerId) {
        setStartsAt(command.startsAt);
        if (matchId) window.sessionStorage.setItem(`match-start:${matchId}`, String(command.startsAt));
      } else if (
        command.type === 'sync-request' &&
        userId === authorityPlayerId &&
        command.senderId !== userId &&
        startsAt !== null
      ) {
        send(encodeMatchStartCommand({ type: 'announce', startsAt, senderId: userId }));
      }
    }
  }, [authorityPlayerId, matchId, messages, send, startsAt, userId]);

  useEffect(() => {
    if (
      !active ||
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
  }, [active, authorityPlayerId, connected, matchId, send, startsAt, userId]);

  useEffect(() => {
    if (
      !active ||
      !connected ||
      !matchId ||
      userId === authorityPlayerId ||
      requestedForMatch.current === matchId
    ) {
      return;
    }
    const sent = send(encodeMatchStartCommand({ type: 'sync-request', senderId: userId }));
    if (sent) requestedForMatch.current = matchId;
  }, [active, authorityPlayerId, connected, matchId, send, userId]);

  const remainingSeconds = useMemo(() => {
    if (!active || startsAt === null) return null;
    const rawSeconds = Math.max(0, Math.ceil((startsAt - now) / 1_000));
    return Math.min(MATCH_START_COUNTDOWN_MS / 1_000, rawSeconds);
  }, [active, now, startsAt]);

  return {
    remainingSeconds,
    readyToPlay: active && remainingSeconds === 0,
  };
}
