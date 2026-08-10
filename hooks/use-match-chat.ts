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
  userId: string;
  active: boolean;
}

export type MatchChatConnectionState = 'idle' | 'connecting' | 'connected' | 'error';
export type MatchPeerPresence = 'unknown' | 'online' | 'offline';
const MAX_RECONNECT_ATTEMPTS = 4;
const PRESENCE_HEARTBEAT_MS = 3_000;

export function useMatchChat({ matchId, userId, active }: UseMatchChatOptions) {
  const [messages, setMessages] = useState<MatchChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<MatchChatConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [opponentPresence, setOpponentPresence] = useState<MatchPeerPresence>('unknown');
  const [generation, setGeneration] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const sequence = useRef(0);

  const nextId = useCallback((prefix: string) => {
    sequence.current += 1;
    return `${prefix}:${Date.now()}:${sequence.current}`;
  }, []);
  const retry = useCallback(() => {
    reconnectAttempts.current = 0;
    setError(null);
    setGeneration((value) => value + 1);
  }, []);
  const send = useCallback((text: string) => {
    const value = text.trim().slice(0, 500);
    const ws = wsRef.current;
    if (!value || !ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify({ text: value }));
      setMessages((old) => [
        ...old,
        { id: nextId(`${userId}:local`), userId, text: value, sentAt: Date.now() },
      ]);
      return true;
    } catch {
      return false;
    }
  }, [nextId, userId]);

  useEffect(() => {
    reconnectAttempts.current = 0;
    sequence.current = 0;
    setMessages([]);
    setError(null);
    setOpponentPresence('unknown');
  }, [active, matchId, userId]);

  useEffect(() => {
    if (!active || !matchId) {
      setConnectionState('idle');
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }
    const wsUrl = getMatchChatWsUrl(matchId);
    if (!wsUrl) {
      setConnectionState('error');
      setError('Chat non configurata.');
      return;
    }

    let cancelled = false;
    let reconnectTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let ws: WebSocket | null = null;
    const reconnect = () => {
      if (cancelled || reconnectTimer || reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return;
      reconnectAttempts.current += 1;
      const delay = Math.min(1_000 * 2 ** (reconnectAttempts.current - 1), 8_000);
      reconnectTimer = window.setTimeout(() => setGeneration((value) => value + 1), delay);
    };

    async function connect() {
      setConnectionState('connecting');
      setError(null);
      try {
        const response = await fetch(
          `/api/tournaments/match/${encodeURIComponent(matchId!)}/chat-ticket`,
          { method: 'POST', cache: 'no-store' },
        );
        const capability = (await response.json().catch(() => ({}))) as { ticket?: string };
        if (!response.ok || !capability.ticket) throw new Error('ticket unavailable');
        if (cancelled) return;
        ws = new WebSocket(wsUrl!);
        wsRef.current = ws;
        ws.onopen = () => {
          if (cancelled || !ws) return;
          ws.send(JSON.stringify({ ticket: capability.ticket }));
          const heartbeat = () => {
            if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ event: 'presence' }));
            }
          };
          heartbeat();
          heartbeatTimer = window.setInterval(heartbeat, PRESENCE_HEARTBEAT_MS);
          reconnectAttempts.current = 0;
          setConnectionState('connected');
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data)) as Record<string, unknown>;
            if (
              data.event === 'presence' &&
              typeof data.user_id === 'string' &&
              data.user_id !== userId &&
              typeof data.online === 'boolean'
            ) {
              setOpponentPresence(data.online ? 'online' : 'offline');
              return;
            }
            if (data.event !== 'chat' || typeof data.text !== 'string') return;
            const sender = typeof data.user_id === 'string' ? data.user_id : 'unknown';
            const sentAt = typeof data.sent_at === 'number' ? data.sent_at : Date.now();
            setMessages((old) => [...old, {
              id: nextId(`${sender}:remote`), userId: sender, text: data.text as string, sentAt,
            }]);
          } catch { /* Ignore malformed frames. */ }
        };
        ws.onerror = () => {
          if (!cancelled) setError('Connessione chat interrotta.');
        };
        ws.onclose = () => {
          if (heartbeatTimer) window.clearInterval(heartbeatTimer);
          heartbeatTimer = null;
          if (cancelled) return;
          setConnectionState('error');
          setError('Chat disconnessa. Riconnessione in corso…');
          reconnect();
        };
      } catch {
        if (!cancelled) {
          setConnectionState('error');
          setError('Chat non disponibile.');
          reconnect();
        }
      }
    }
    void connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      ws?.close();
      if (wsRef.current === ws) wsRef.current = null;
    };
  }, [active, generation, matchId, nextId]);

  return { messages, send, connectionState, error, retry, opponentPresence };
}
