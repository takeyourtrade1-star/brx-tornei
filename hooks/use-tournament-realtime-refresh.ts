'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTournamentEventsWsUrl } from '@/lib/tournament-events-url';

const AUTH_ACK_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 8_000;
const HEARTBEAT_MS = 15_000;

interface TournamentRealtimeRefreshOptions {
  tournamentId?: string | null;
  active: boolean;
}

/**
 * Invalida l'RSC appena il backend committa un cambiamento del tavolo.
 * Il payload non è usato come stato: PostgreSQL resta autorevole e il polling
 * già presente continua a coprire Redis/WebSocket non disponibili.
 */
export function useTournamentRealtimeRefresh({
  tournamentId,
  active,
}: TournamentRealtimeRefreshOptions): string | undefined {
  const router = useRouter();
  const [serverClock, setServerClock] = useState<{
    tournamentId: string;
    value: string;
  }>();

  useEffect(() => {
    if (!active || !tournamentId) return;
    const wsUrl = getTournamentEventsWsUrl(tournamentId);
    if (!wsUrl) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let refreshTimer: number | null = null;
    let authTimer: number | null = null;
    let heartbeatTimer: number | null = null;
    let attempts = 0;

    const scheduleRefresh = () => {
      if (cancelled || refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        if (!cancelled) router.refresh();
      }, 75);
    };
    const reconnect = () => {
      if (cancelled || reconnectTimer !== null) return;
      attempts += 1;
      const delay = Math.min(500 * 2 ** Math.max(0, attempts - 1), MAX_RECONNECT_DELAY_MS);
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, delay);
    };
    const connect = async () => {
      try {
        const response = await fetch(
          `/api/tournaments/tournament/${encodeURIComponent(tournamentId)}/events-ticket`,
          { method: 'POST', cache: 'no-store', credentials: 'same-origin' },
        );
        const capability = (await response.json().catch(() => ({}))) as { ticket?: string };
        if (!response.ok || !capability.ticket) throw new Error('ticket unavailable');
        if (cancelled) return;

        const nextSocket = new WebSocket(wsUrl);
        socket = nextSocket;
        nextSocket.onopen = () => {
          if (cancelled) return;
          nextSocket.send(JSON.stringify({ ticket: capability.ticket }));
          authTimer = window.setTimeout(() => {
            if (nextSocket.readyState === WebSocket.OPEN) {
              nextSocket.close(4001, 'Authentication timeout');
            }
          }, AUTH_ACK_TIMEOUT_MS);
        };
        nextSocket.onmessage = (event) => {
          if (cancelled) return;
          try {
            const data = JSON.parse(String(event.data)) as Record<string, unknown>;
            if (typeof data.server_time === 'number' && Number.isFinite(data.server_time)) {
              setServerClock({
                tournamentId,
                value: new Date(data.server_time).toISOString(),
              });
            }
            if (data.event === 'authenticated') {
              if (authTimer !== null) window.clearTimeout(authTimer);
              authTimer = null;
              attempts = 0;
              if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
              heartbeatTimer = window.setInterval(() => {
                if (nextSocket.readyState === WebSocket.OPEN) {
                  nextSocket.send(JSON.stringify({ event: 'heartbeat' }));
                }
              }, HEARTBEAT_MS);
              // Chiude la race fra lo snapshot RSC e la sottoscrizione Redis.
              scheduleRefresh();
            } else if (data.event === 'tournament-state-changed') {
              scheduleRefresh();
            }
          } catch {
            /* frame non valido: nessuno stato client da corrompere */
          }
        };
        nextSocket.onerror = () => nextSocket.close();
        nextSocket.onclose = () => {
          if (authTimer !== null) window.clearTimeout(authTimer);
          authTimer = null;
          if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
          heartbeatTimer = null;
          if (!cancelled) reconnect();
        };
      } catch {
        reconnect();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    void connect();

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
      if (authTimer !== null) window.clearTimeout(authTimer);
      if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
      socket?.close();
    };
  }, [active, router, tournamentId]);

  return active && tournamentId && serverClock?.tournamentId === tournamentId
    ? serverClock.value
    : undefined;
}
