'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import type { Participant } from '@/types/tournament';
import {
  clampLife,
  DEFAULT_STARTING_LIFE,
  encodeMatchLifeCommand,
  parseMatchLifeCommand,
} from '@/lib/match-life-protocol';

interface UseMatchLifeOptions {
  matchId?: string | null;
  players: [Participant, Participant];
  userId: string;
  authorityPlayerId: string;
  messages: MatchChatMessage[];
  connected: boolean;
  send: (text: string) => boolean;
}

export function useMatchLife({
  matchId,
  players,
  userId,
  authorityPlayerId,
  messages,
  connected,
  send,
}: UseMatchLifeOptions) {
  const firstPlayerId = players[0].id;
  const secondPlayerId = players[1].id;
  const playerIds = useMemo(
    () => [firstPlayerId, secondPlayerId],
    [firstPlayerId, secondPlayerId],
  );
  const [startingLife, setStartingLifeState] = useState(DEFAULT_STARTING_LIFE);
  const [lifeByPlayerId, setLifeByPlayerId] = useState<Record<string, number>>(() =>
    createLifeMap(playerIds, DEFAULT_STARTING_LIFE),
  );
  const processedMessages = useRef(new Set<string>());
  const requestedForMatch = useRef<string | null>(null);
  const skipNextPersistence = useRef(true);
  const stateRef = useRef({ startingLife, lifeByPlayerId });

  useEffect(() => {
    if (!matchId) return;
    skipNextPersistence.current = true;
    const stored = window.sessionStorage.getItem(`match-life:${matchId}`);
    if (!stored) return;
    const snapshot = parseMatchLifeCommand(stored);
    if (!snapshot || snapshot.type !== 'snapshot') return;
    setStartingLifeState(snapshot.startingLife);
    setLifeByPlayerId(snapshot.lifeByPlayerId);
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (skipNextPersistence.current) {
      skipNextPersistence.current = false;
      return;
    }
    window.sessionStorage.setItem(
      `match-life:${matchId}`,
      encodeMatchLifeCommand({
        type: 'snapshot',
        startingLife,
        lifeByPlayerId,
        senderId: authorityPlayerId,
      }),
    );
  }, [authorityPlayerId, lifeByPlayerId, matchId, startingLife]);

  useEffect(() => {
    stateRef.current = { startingLife, lifeByPlayerId };
  }, [startingLife, lifeByPlayerId]);

  useEffect(() => {
    setLifeByPlayerId((current) => {
      const next = { ...current };
      for (const playerId of playerIds) next[playerId] ??= startingLife;
      return next;
    });
  }, [playerIds, startingLife]);

  useEffect(() => {
    for (const message of messages) {
      if (processedMessages.current.has(message.id)) continue;
      processedMessages.current.add(message.id);
      const command = parseMatchLifeCommand(message.text);
      if (!command || command.senderId !== message.userId) continue;

      const authoritative = message.userId === authorityPlayerId;
      if (command.type === 'setup' && authoritative) {
        setStartingLifeState(command.startingLife);
        setLifeByPlayerId(createLifeMap(playerIds, command.startingLife));
      } else if (
        command.type === 'delta' &&
        command.targetId === command.senderId &&
        playerIds.includes(command.targetId)
      ) {
        setLifeByPlayerId((current) => ({
          ...current,
          [command.targetId]: clampLife((current[command.targetId] ?? startingLife) + command.delta),
        }));
      } else if (command.type === 'snapshot' && authoritative) {
        setStartingLifeState(command.startingLife);
        setLifeByPlayerId((current) => ({ ...current, ...command.lifeByPlayerId }));
      } else if (
        command.type === 'sync-request' &&
        userId === authorityPlayerId &&
        command.senderId !== userId
      ) {
        const state = stateRef.current;
        send(
          encodeMatchLifeCommand({
            type: 'snapshot',
            startingLife: state.startingLife,
            lifeByPlayerId: state.lifeByPlayerId,
            senderId: userId,
          }),
        );
      }
    }
  }, [authorityPlayerId, messages, playerIds, send, startingLife, userId]);

  useEffect(() => {
    if (
      !connected ||
      !matchId ||
      userId === authorityPlayerId ||
      requestedForMatch.current === matchId
    ) {
      return;
    }
    requestedForMatch.current = matchId;
    send(encodeMatchLifeCommand({ type: 'sync-request', senderId: userId }));
  }, [authorityPlayerId, connected, matchId, send, userId]);

  const setStartingLife = useCallback(
    (value: number) => {
      if (userId !== authorityPlayerId) return false;
      return send(
        encodeMatchLifeCommand({
          type: 'setup',
          startingLife: clampLife(value),
          senderId: userId,
        }),
      );
    },
    [authorityPlayerId, send, userId],
  );

  const changeLife = useCallback(
    (targetId: string, delta: number) => {
      if (targetId !== userId) return false;
      return send(encodeMatchLifeCommand({ type: 'delta', targetId, delta, senderId: userId }));
    },
    [send, userId],
  );

  const resetLife = useCallback(() => setStartingLife(startingLife), [setStartingLife, startingLife]);

  return { startingLife, lifeByPlayerId, setStartingLife, changeLife, resetLife };
}

function createLifeMap(playerIds: string[], startingLife: number): Record<string, number> {
  return Object.fromEntries(playerIds.map((playerId) => [playerId, startingLife]));
}
