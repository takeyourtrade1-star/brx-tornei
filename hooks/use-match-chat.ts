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

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export function useMatchChat({ matchId, accessToken, userId, active }: UseMatchChatOptions) {
  const [messages, setMessages] = useState<MatchChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify({ text: trimmed }));
      // Backend non rimanda eco al mittente: mostriamo subito il messaggio locale.
      const sentAt = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `${userId}-${sentAt}-local`,
          userId,
          text: trimmed,
          sentAt,
        },
      ]);
      return true;
    },
    [userId],
  );

  useEffect(() => {
    if (!active || !matchId || !accessToken) {
      setConnectionState('idle');
      setError(null);
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const url = getMatchChatWsUrl(matchId);
    if (!url) {
      setConnectionState('error');
      setError('Chat non configurata (NEXT_PUBLIC_TOURNAMENTS_API_URL).');
      return;
    }

    let cancelled = false;
    setConnectionState('connecting');
    setError(null);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) return;
      ws.send(JSON.stringify({ token: accessToken }));
      setConnectionState('connected');
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
        const userId = typeof data.user_id === 'string' ? data.user_id : 'unknown';
        const sentAt = typeof data.sent_at === 'number' ? data.sent_at : Date.now();
        setMessages((prev) => [
          ...prev,
          {
            id: `${userId}-${sentAt}-${prev.length}`,
            userId,
            text: data.text!,
            sentAt,
          },
        ]);
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onerror = () => {
      if (cancelled) return;
      setConnectionState('error');
      setError('Connessione chat interrotta.');
    };

    ws.onclose = () => {
      if (cancelled) return;
      setConnectionState('error');
      setError('Chat disconnessa.');
    };

    return () => {
      cancelled = true;
      ws.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [active, matchId, accessToken]);

  return { messages, send, connectionState, error };
}
