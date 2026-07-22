'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import type { Participant } from '@/types/tournament';
import { clampLife, DEFAULT_STARTING_LIFE, encodeMatchLifeCommand, parseMatchLifeCommand } from '@/lib/match-life-protocol';
import { createLifeMap, nextLifeCommandId, rememberLifeCommand } from './match-life-state';

interface UseMatchLifeOptions {
  matchId?: string | null;
  players: [Participant, Participant];
  userId: string;
  authorityPlayerId: string;
  messages: MatchChatMessage[];
  connected: boolean;
  send: (text: string) => boolean;
}

interface LifeState { startingLife: number; lifeByPlayerId: Record<string, number>; revision: number; }
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
  const playerIds = useMemo(() => [firstPlayerId, secondPlayerId], [firstPlayerId, secondPlayerId]);
  const [startingLife, setStartingLifeState] = useState(DEFAULT_STARTING_LIFE);
  const [lifeByPlayerId, setLifeByPlayerId] = useState<Record<string, number>>(() =>
    createLifeMap(playerIds, DEFAULT_STARTING_LIFE),
  );
  const [syncing, setSyncing] = useState(false);
  const stateRef = useRef<LifeState>({ startingLife, lifeByPlayerId, revision: 0 });
  const processedMessages = useRef(new Set<string>());
  const skipStaleMessages = useRef(true);
  const processedCommands = useRef(new Set<string>());
  const requestedForMatch = useRef<string | null>(null);
  const awaitingSnapshot = useRef(false);
  const skipNextPersistence = useRef(true);
  const commandSequence = useRef(0);

  const commitState = useCallback((nextState: LifeState) => {
    stateRef.current = nextState;
    setStartingLifeState(nextState.startingLife);
    setLifeByPlayerId(nextState.lifeByPlayerId);
  }, []);

  const applySetup = useCallback((nextStartingLife: number, revision: number) => {
    commitState({
      startingLife: nextStartingLife,
      lifeByPlayerId: createLifeMap(playerIds, nextStartingLife),
      revision,
    });
  }, [commitState, playerIds]);

  const applyDelta = useCallback((targetId: string, delta: number) => {
    const current = stateRef.current;
    commitState({
      ...current,
      lifeByPlayerId: {
        ...current.lifeByPlayerId,
        [targetId]: clampLife((current.lifeByPlayerId[targetId] ?? current.startingLife) + delta),
      },
    });
  }, [commitState]);

  useEffect(() => {
    processedMessages.current.clear();
    skipStaleMessages.current = true;
    processedCommands.current.clear();
    requestedForMatch.current = null;
    awaitingSnapshot.current = false;
    setSyncing(userId !== authorityPlayerId);
    skipNextPersistence.current = true;
    const defaultState = {
      startingLife: DEFAULT_STARTING_LIFE,
      lifeByPlayerId: createLifeMap(playerIds, DEFAULT_STARTING_LIFE),
      revision: 0,
    };
    const stored = matchId ? window.sessionStorage.getItem(`match-life:${matchId}`) : null;
    const snapshot = stored ? parseMatchLifeCommand(stored) : null;
    const restoredState = snapshot?.type === 'snapshot'
      ? {
          startingLife: snapshot.startingLife,
          lifeByPlayerId: snapshot.lifeByPlayerId,
          revision: snapshot.revision ?? 0,
        }
      : defaultState;
    commitState(restoredState);
  }, [authorityPlayerId, commitState, matchId, playerIds, userId]);

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
        revision: stateRef.current.revision,
      }),
    );
  }, [authorityPlayerId, lifeByPlayerId, matchId, startingLife]);

  useEffect(() => {
    if (skipStaleMessages.current) {
      skipStaleMessages.current = false;
      return;
    }
    for (const message of messages) {
      if (processedMessages.current.has(message.id)) continue;
      processedMessages.current.add(message.id);
      const command = parseMatchLifeCommand(message.text);
      if (!command || command.senderId !== message.userId) continue;
      if (command.commandId && rememberLifeCommand(processedCommands.current, command.commandId)) continue;

      const authoritative = message.userId === authorityPlayerId;
      if (command.type === 'setup' && authoritative) {
        const revision = command.revision ?? stateRef.current.revision + 1;
        if (revision > stateRef.current.revision || command.revision === undefined) {
          applySetup(command.startingLife, revision);
        }
      } else if (
        command.type === 'delta' &&
        command.targetId === command.senderId &&
        playerIds.includes(command.targetId) &&
        (command.revision === undefined || command.revision === stateRef.current.revision)
      ) {
        applyDelta(command.targetId, command.delta);
      } else if (command.type === 'reset' &&
        command.targetId === command.senderId &&
        playerIds.includes(command.targetId) &&
        (command.revision === undefined || command.revision === stateRef.current.revision)) {
        const current = stateRef.current;
        commitState({
          ...current,
          lifeByPlayerId: { ...current.lifeByPlayerId, [command.targetId]: current.startingLife },
        });
      } else if (command.type === 'snapshot' && authoritative && awaitingSnapshot.current) {
        const revision = command.revision ?? 0;
        if (revision >= stateRef.current.revision) {
          commitState({
            startingLife: command.startingLife,
            lifeByPlayerId: command.lifeByPlayerId,
            revision,
          });
        }
        awaitingSnapshot.current = false;
        setSyncing(false);
      } else if (
        command.type === 'sync-request' &&
        userId === authorityPlayerId &&
        command.senderId !== userId
      ) {
        const state = stateRef.current;
        send(encodeMatchLifeCommand({
          type: 'snapshot',
          startingLife: state.startingLife,
          lifeByPlayerId: state.lifeByPlayerId,
          senderId: userId,
          revision: state.revision,
          commandId: nextLifeCommandId(commandSequence, userId),
        }));
      }
    }
  }, [applyDelta, applySetup, authorityPlayerId, commitState, messages, playerIds, send, userId]);

  useEffect(() => {
    if (!connected || !matchId || userId === authorityPlayerId || requestedForMatch.current === matchId) return;
    requestedForMatch.current = matchId;
    const sent = send(encodeMatchLifeCommand({
      type: 'sync-request',
      senderId: userId,
      revision: stateRef.current.revision,
      commandId: nextLifeCommandId(commandSequence, userId),
    }));
    awaitingSnapshot.current = sent;
    setSyncing(sent);
  }, [authorityPlayerId, connected, matchId, send, userId]);

  useEffect(() => {
    if (!connected && userId !== authorityPlayerId) {
      requestedForMatch.current = null;
      awaitingSnapshot.current = false;
      setSyncing(true);
    }
  }, [authorityPlayerId, connected, userId]);

  const setStartingLife = useCallback((value: number) => {
    if (userId !== authorityPlayerId) return false;
    const nextStartingLife = clampLife(value);
    const revision = stateRef.current.revision + 1;
    const commandId = nextLifeCommandId(commandSequence, userId);
    if (!send(encodeMatchLifeCommand({ type: 'setup', startingLife: nextStartingLife, senderId: userId, revision, commandId }))) {
      return false;
    }
    rememberLifeCommand(processedCommands.current, commandId);
    applySetup(nextStartingLife, revision);
    return true;
  }, [applySetup, authorityPlayerId, send, userId]);

  const changeLife = useCallback((targetId: string, delta: number) => {
    if (targetId !== userId) return false;
    const commandId = nextLifeCommandId(commandSequence, userId);
    const revision = stateRef.current.revision;
    if (!send(encodeMatchLifeCommand({ type: 'delta', targetId, delta, senderId: userId, revision, commandId }))) {
      return false;
    }
    rememberLifeCommand(processedCommands.current, commandId);
    applyDelta(targetId, delta);
    return true;
  }, [applyDelta, send, userId]);

  const resetLife = useCallback(() => {
    const current = stateRef.current;
    const commandId = nextLifeCommandId(commandSequence, userId);
    if (!send(encodeMatchLifeCommand({
      type: 'reset',
      targetId: userId,
      senderId: userId,
      revision: current.revision,
      commandId,
    }))) return false;
    rememberLifeCommand(processedCommands.current, commandId);
    commitState({
      ...current,
      lifeByPlayerId: { ...current.lifeByPlayerId, [userId]: current.startingLife },
    });
    return true;
  }, [commitState, send, userId]);

  const synced = userId === authorityPlayerId || !syncing;
  return { startingLife, lifeByPlayerId, setStartingLife, changeLife, resetLife, synced };
}
