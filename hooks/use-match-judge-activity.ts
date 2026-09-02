'use client';

import { useEffect, useRef, useState } from 'react';
import type { MatchChatMessage } from '@/hooks/use-match-chat';
import type { MatchJudgeStatus } from '@/types/tournament';
import {
  encodeMatchJudgeSignal,
  parseMatchJudgeSignal,
  type MatchJudgeSignalType,
} from '@/lib/match-judge-protocol';

const TYPING_TIMEOUT_MS = 6_000;
const THINKING_TIMEOUT_MS = 30_000;
const DEBOUNCE_TYPING_MS = 2_000;

interface UseMatchJudgeActivityOptions {
  userId: string;
  opponentId?: string;
  opponentName?: string;
  messages: MatchChatMessage[];
  send: (text: string) => boolean;
  draft: string;
  pending: boolean;
  judgeStatus?: MatchJudgeStatus;
}

export interface MatchJudgeActivityState {
  isAsking: boolean;
  isThinking: boolean;
  label: string | null;
}

export function useMatchJudgeActivity({
  userId,
  opponentId,
  opponentName = 'L’avversario',
  messages,
  send,
  draft,
  pending,
  judgeStatus,
}: UseMatchJudgeActivityOptions): MatchJudgeActivityState {
  const [opponentSignal, setOpponentSignal] = useState<MatchJudgeSignalType>('idle');
  const lastSignalTime = useRef(0);
  const lastBroadcastTime = useRef(0);
  const processedMessageIds = useRef(new Set<string>());

  // 1. Invia il segnale typing/idle dal client locale quando l'utente scrive nella chat del Judge
  useEffect(() => {
    const hasText = draft.trim().length > 0;
    const now = Date.now();

    if (hasText) {
      if (now - lastBroadcastTime.current >= DEBOUNCE_TYPING_MS) {
        lastBroadcastTime.current = now;
        send(encodeMatchJudgeSignal({ type: 'typing', senderId: userId, timestamp: now }));
      }
    } else if (lastBroadcastTime.current > 0) {
      lastBroadcastTime.current = 0;
      send(encodeMatchJudgeSignal({ type: 'idle', senderId: userId }));
    }
  }, [draft, send, userId]);

  // 2. Invia il segnale thinking quando la richiesta è stata inviata e si attende la risposta di Asso
  useEffect(() => {
    if (pending) {
      send(encodeMatchJudgeSignal({ type: 'thinking', senderId: userId, timestamp: Date.now() }));
    }
  }, [pending, send, userId]);

  // 3. Riceve i segnali inviati dall'avversario sul canale WebSocket della partita
  useEffect(() => {
    for (const msg of messages) {
      if (processedMessageIds.current.has(msg.id)) continue;
      processedMessageIds.current.add(msg.id);

      // Considera solo i messaggi inviati dall'avversario
      if (msg.userId === userId || (opponentId && msg.userId !== opponentId)) continue;

      const signal = parseMatchJudgeSignal(msg.text);
      if (!signal) continue;

      if (signal.type === 'typing') {
        lastSignalTime.current = Date.now();
        setOpponentSignal('typing');
      } else if (signal.type === 'thinking') {
        lastSignalTime.current = Date.now();
        setOpponentSignal('thinking');
      } else if (signal.type === 'idle') {
        setOpponentSignal('idle');
      }
    }
  }, [messages, opponentId, userId]);

  // 4. Timer di decadimento: azzera il segnale se l'avversario smette di scrivere o scade il timeout
  useEffect(() => {
    if (opponentSignal === 'idle') return;

    const timeoutMs = opponentSignal === 'typing' ? TYPING_TIMEOUT_MS : THINKING_TIMEOUT_MS;
    const interval = window.setInterval(() => {
      if (Date.now() - lastSignalTime.current >= timeoutMs) {
        setOpponentSignal('idle');
      }
    }, 1_000);

    return () => window.clearInterval(interval);
  }, [opponentSignal]);

  const isServerProcessing = judgeStatus === 'processing' && !pending;
  const isThinking = opponentSignal === 'thinking' || isServerProcessing;
  const isAsking = opponentSignal === 'typing' || isThinking;

  let label: string | null = null;
  if (isThinking) {
    label = 'Asso sta pensando e rispondendo…';
  } else if (opponentSignal === 'typing') {
    label = `${opponentName} sta scrivendo ad Asso…`;
  }

  return {
    isAsking,
    isThinking,
    label,
  };
}
