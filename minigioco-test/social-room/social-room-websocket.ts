"use client";

import { getSocialRoomWsUrl } from "@/lib/social-room-url";
import {
  parseSocialRoomServerControlFrame,
  type SocialRoomServerControlFrame,
} from "@/lib/social-room-ws-protocol";
import type { SocialRoomEvent } from "./social-room-protocol";
import { toSocialRoomClientFrame } from "./social-room-client-frame";

const AUTH_TIMEOUT_MS = 10_000;
const HEARTBEAT_MS = 15_000;
const MAX_RECONNECT_DELAY_MS = 8_000;

export interface SocialRoomSocketCallbacks {
  readonly onAuthenticated: (peerId: string) => void;
  readonly onEvent: (value: unknown) => void;
  readonly onAcknowledgement: (
    frame: Extract<SocialRoomServerControlFrame, { event: "ack" }>,
  ) => void;
  readonly onState: (connected: boolean, error: string | null) => void;
}

export interface SocialRoomSocketSession {
  readonly send: (event: SocialRoomEvent) => boolean;
  readonly close: () => void;
}

/** Trasporto WS autenticato, con ticket monouso e riconnessione limitata. */
export function openSocialRoomSocket(
  callbacks: SocialRoomSocketCallbacks,
): SocialRoomSocketSession {
  const wsUrl = getSocialRoomWsUrl();
  let socket: WebSocket | null = null;
  let authenticated = false;
  let closed = false;
  let attempts = 0;
  let reconnectTimer: number | null = null;
  let heartbeatTimer: number | null = null;
  let authTimer: number | null = null;
  let ticketRequest: AbortController | null = null;

  const clearSocketTimers = (): void => {
    if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
    if (authTimer !== null) window.clearTimeout(authTimer);
    heartbeatTimer = null;
    authTimer = null;
  };

  const scheduleReconnect = (): void => {
    if (closed || reconnectTimer !== null || !wsUrl) return;
    attempts += 1;
    const delay = Math.min(500 * 2 ** Math.max(0, attempts - 1), MAX_RECONNECT_DELAY_MS);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, delay);
  };

  const handleClose = (current: WebSocket): void => {
    if (socket !== current) return;
    socket = null;
    authenticated = false;
    clearSocketTimers();
    if (closed) return;
    callbacks.onState(false, "Connessione Piazza interrotta. Riconnessione in corso…");
    scheduleReconnect();
  };

  async function connect(): Promise<void> {
    if (closed || !wsUrl) return;
    ticketRequest?.abort();
    ticketRequest = new AbortController();
    try {
      const response = await fetch("/api/tournaments/social-room/ticket", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        signal: ticketRequest.signal,
      });
      const payload = await response.json().catch(() => null) as unknown;
      const ticket = readTicket(payload);
      if (!response.ok || !ticket || closed) throw new Error("ticket unavailable");

      const current = new WebSocket(wsUrl);
      socket = current;
      current.onopen = () => {
        if (closed) return;
        current.send(JSON.stringify({ ticket }));
        authTimer = window.setTimeout(() => {
          if (current.readyState === WebSocket.OPEN) current.close(4001, "Authentication timeout");
        }, AUTH_TIMEOUT_MS);
      };
      current.onmessage = (message) => {
        if (closed) return;
        const control = parseSocialRoomServerControlFrame(String(message.data));
        if (control?.event === "authenticated") {
          if (authTimer !== null) window.clearTimeout(authTimer);
          authTimer = null;
          authenticated = true;
          attempts = 0;
          callbacks.onState(true, null);
          callbacks.onAuthenticated(control.peerId);
          heartbeatTimer = window.setInterval(() => {
            if (current.readyState === WebSocket.OPEN) {
              current.send(JSON.stringify({ type: "heartbeat" }));
            }
          }, HEARTBEAT_MS);
          return;
        }
        if (control?.event === "ack") {
          callbacks.onAcknowledgement(control);
          return;
        }
        try {
          callbacks.onEvent(JSON.parse(String(message.data)) as unknown);
        } catch {
          // I frame estranei non modificano lo stato della stanza.
        }
      };
      current.onerror = () => current.close();
      current.onclose = () => handleClose(current);
    } catch (error) {
      if (closed || (error instanceof DOMException && error.name === "AbortError")) return;
      callbacks.onState(false, "Piazza non disponibile. Riconnessione in corso…");
      scheduleReconnect();
    }
  }

  const send = (event: SocialRoomEvent): boolean => {
    if (!authenticated || socket?.readyState !== WebSocket.OPEN) return false;
    try {
      socket.send(JSON.stringify(toSocialRoomClientFrame(event)));
      return true;
    } catch {
      return false;
    }
  };

  const close = (): void => {
    closed = true;
    authenticated = false;
    ticketRequest?.abort();
    if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    clearSocketTimers();
    socket?.close();
    socket = null;
  };

  if (!wsUrl) callbacks.onState(false, "Realtime Piazza non configurato.");
  else void connect();
  return { send, close };
}

function readTicket(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const ticket = (value as Record<string, unknown>).ticket;
  return typeof ticket === "string" && ticket.length > 0 ? ticket : null;
}
