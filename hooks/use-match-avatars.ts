'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import { GAME_AVATARS, getSavedAvatarId } from '@/lib/avatars';
import {
  encodeMatchAvatarCommand,
  parseMatchAvatarCommand,
} from '@/lib/match-avatar-protocol';
import type { Participant } from '@/types/tournament';

interface UseMatchAvatarsOptions {
  matchId?: string | null;
  players: [Participant, Participant];
  userId: string;
  messages: MatchChatMessage[];
  connected: boolean;
  send: (text: string) => boolean;
}

/** Condivide tra i due client soltanto l'ID pubblico dell'avatar selezionato. */
export function useMatchAvatars({
  matchId,
  players,
  userId,
  messages,
  connected,
  send,
}: UseMatchAvatarsOptions): Record<string, string> {
  const [localAvatarId, setLocalAvatarId] = useState(readSelectedAvatarId);
  const [avatarIds, setAvatarIds] = useState<Record<string, string>>(() => ({
    [userId]: localAvatarId,
  }));
  const processedMessages = useRef(new Set<string>());
  const announcedKey = useRef<string | null>(null);
  const requestedForMatch = useRef<string | null>(null);
  const participantIds = useMemo(
    () => new Set(players.map((player) => player.id)),
    [players],
  );

  useEffect(() => {
    const nextLocalAvatarId = readSelectedAvatarId();
    setLocalAvatarId(nextLocalAvatarId);
    setAvatarIds({ [userId]: nextLocalAvatarId });
    processedMessages.current.clear();
    announcedKey.current = null;
    requestedForMatch.current = null;
  }, [matchId, userId]);

  useEffect(() => {
    const onAvatarChanged = (event: Event) => {
      const avatarId = (event as CustomEvent<{ avatarId?: unknown }>).detail?.avatarId;
      if (!isKnownAvatarId(avatarId)) return;
      setLocalAvatarId(avatarId);
      setAvatarIds((current) => ({ ...current, [userId]: avatarId }));
    };
    window.addEventListener('ebartex-avatar-changed', onAvatarChanged);
    return () => window.removeEventListener('ebartex-avatar-changed', onAvatarChanged);
  }, [userId]);

  useEffect(() => {
    if (!connected || !matchId) {
      announcedKey.current = null;
      requestedForMatch.current = null;
      return;
    }
    const nextAnnouncedKey = `${matchId}:${localAvatarId}`;
    if (announcedKey.current !== nextAnnouncedKey) {
      if (send(encodeMatchAvatarCommand({
        type: 'announce',
        senderId: userId,
        avatarId: localAvatarId,
      }))) {
        announcedKey.current = nextAnnouncedKey;
      }
    }
    if (requestedForMatch.current !== matchId) {
      if (send(encodeMatchAvatarCommand({ type: 'sync-request', senderId: userId }))) {
        requestedForMatch.current = matchId;
      }
    }
  }, [connected, localAvatarId, matchId, send, userId]);

  useEffect(() => {
    for (const message of messages) {
      if (processedMessages.current.has(message.id)) continue;
      processedMessages.current.add(message.id);
      const command = parseMatchAvatarCommand(message.text);
      if (
        !command ||
        command.senderId !== message.userId ||
        !participantIds.has(command.senderId)
      ) {
        continue;
      }
      if (command.type === 'announce' && isKnownAvatarId(command.avatarId)) {
        setAvatarIds((current) => ({
          ...current,
          [command.senderId]: command.avatarId,
        }));
      } else if (
        command.type === 'sync-request' &&
        command.senderId !== userId &&
        connected
      ) {
        send(encodeMatchAvatarCommand({
          type: 'announce',
          senderId: userId,
          avatarId: localAvatarId,
        }));
      }
    }
  }, [connected, localAvatarId, messages, participantIds, send, userId]);

  return avatarIds;
}

function isKnownAvatarId(value: unknown): value is string {
  return typeof value === 'string' && GAME_AVATARS.some((avatar) => avatar.id === value);
}

function readSelectedAvatarId(): string {
  const savedAvatarId = getSavedAvatarId();
  return isKnownAvatarId(savedAvatarId) ? savedAvatarId : GAME_AVATARS[0]?.id ?? 'crown';
}
