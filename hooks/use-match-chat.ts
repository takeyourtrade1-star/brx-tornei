'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getMatchChatWsUrl } from '@/lib/match-chat-url';

export interface MatchChatMessage {
  id: string;
  userId: string;
  text: string;
  sentAt: number;
}

interface UseMatchChatOptions {
  matchId: string | null | undefined;
  accessToken: string | null | undefined;
  userId: string;
  active: boolean;
}

export type MatchChatConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const MAX_RECONNECT_ATTEMPTS = 4;

export function useMatchChat({ matchId, accessToken, userId, active }: UseMatchChatOptions) {
  const [messages, setMessages] = useState<MatchChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<MatchChatConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const messageSequence = useRef(0);

  const nextMessageId = useCallback((prefix: string) => {
    messageSequence.current += 1;
    return `${prefix}:${Date.now()}:${messageSequence.current}`;
  }, []);

  const retry = useCallback(() => {
    reconnectAttempts.current = 0;
    setError(null);
    setGeneration((current) => current + 1);
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      try {
        ws.send(JSON.stringify({ text: trimmed }));
      } catch {
        return false;
      }
      const sentAt = Date.now();
      setMessages((previous) => [
        ...previous,
        { id: nextMessageId(`${userId}:local`), userId, text: trimmed, sentAt },
      ]);
      return true;
    },
    [nextMessageId, userId],
  );

  useEffect(() => {
    reconnectAttempts.current = 0;
    messageSequence.current = 0;
    setMessages([]);
    setError(null);
  }, [active, matchId, userId]);

  useEffect(() => {
    if (!active || !matchId || !accessToken) {
      setConnectionState('idle');
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const url = getMatchChatWsUrl(matchId);
    if (!url) {
      setConnectionState('error');
      setError('Chat non configurata.');
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    setConnectionState('connecting');
    setError(null);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return;
      reconnectAttempts.current += 1;
      const delay = Math.min(1_000 * 2 ** (reconnectAttempts.current - 1), 8_000);
      reconnectTimer = window.setTimeout(() => setGeneration((current) => current + 1), delay);
    };

    ws.onopen = () => {
      if (cancelled) return;
      try {
        ws.send(JSON.stringify({ token: accessToken }));
        reconnectAttempts.current = 0;
        setConnectionState('connected');
      } catch {
        ws.close();
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          event?: string;
          text?: string;
          user_id?: string;
          sent_at?: number;
        };
        if (data.event !== 'chat' || typeof data.text !== 'string') return;
        const text = data.text;
        const senderId = typeof data.user_id === 'string' ? data.user_id : 'unknown';
        const sentAt = typeof data.sent_at === 'number' ? data.sent_at : Date.now();
        setMessages((previous) => [
          ...previous,
          { id: nextMessageId(`${senderId}:remote`), userId: senderId, text, sentAt },
        ]);
      } catch {
        /* Frame non valido: non interrompe la connessione. */
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      setConnectionState('error');
      setError('Connessione chat interrotta. Riconnessione in corso…');
    };

    ws.onclose = () => {
      if (cancelled) return;
      setConnectionState('error');
      setError('Chat disconnessa.');
      scheduleReconnect();
    };

    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [accessToken, active, generation, matchId, nextMessageId]);

  return { messages, send, connectionState, error, retry };
}
