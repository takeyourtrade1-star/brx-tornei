'use client';

/**
 * Canale di signaling minimale su HTTP polling.
 *
 * Stesso paradigma del pairing foto delle aste (new_frontend_brx): niente
 * WebSocket, gira su Amplify/serverless. Trasporta solo SDP (offer/answer) e
 * candidati ICE (trickle) per APRIRE la connessione. Una volta connessi, il
 * VIDEO viaggia P2P (latenza minima) e il polling si ferma: il signaling non
 * incide sul lag del flusso, solo sul tempo di setup.
 */

export type SignalRole = 'host' | 'guest';
export type SignalKind = 'offer' | 'answer' | 'candidate' | 'bye' | 'offline';

export interface SignalMessage {
  seq: number;
  from: SignalRole;
  kind: SignalKind;
  data: unknown;
}

const POLL_INTERVAL_MS = 600;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRY_DELAY_MS = 5_000;
const TERMINAL_STATUSES = new Set([401, 403, 404, 410]);

export class SignalingChannel {
  private base: string;
  private role: SignalRole;
  private since = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private stopped = false;
  private onMessage: (m: SignalMessage) => void | Promise<void>;
  private onClosed?: () => void;
  private consecutiveFailures = 0;

  constructor(
    sessionId: string,
    role: SignalRole,
    onMessage: (m: SignalMessage) => void | Promise<void>,
    basePath?: string,
    onClosed?: () => void,
  ) {
    this.base =
      basePath ?? `/api/tornei/webcam/${encodeURIComponent(sessionId)}`;
    this.role = role;
    this.onMessage = onMessage;
    this.onClosed = onClosed;
  }

  start(): void {
    this.stopped = false;
    this.connected = false;
    void this.poll();
  }

  setConnected(connected: boolean): void {
    const wasConnected = this.connected;
    this.connected = connected;
    if (connected && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    } else if (wasConnected && !connected && !this.stopped && !this.timer) {
      void this.poll();
    }
  }

  async send(kind: SignalKind, data: unknown): Promise<void> {
    const response = await fetch(this.base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: this.role, kind, data }),
        keepalive: kind === 'bye' || kind === 'offline',
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    if (TERMINAL_STATUSES.has(response.status)) {
      this.closeTerminal();
    }
    if (!response.ok) throw new Error(`Signaling request failed (${response.status})`);
  }

  private closeTerminal(): void {
    this.stop();
    this.onClosed?.();
  }

  private retryDelay(response?: Response): number {
    if (response?.status === 429) {
      const retryAfter = Number(response.headers.get('Retry-After'));
      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        return Math.min(retryAfter * 1_000, 30_000);
      }
    }
    return Math.min(
      POLL_INTERVAL_MS * 2 ** Math.max(0, this.consecutiveFailures - 1),
      MAX_RETRY_DELAY_MS,
    );
  }

  private async poll(): Promise<void> {
    if (this.stopped || this.connected) return;
    let nextDelay = POLL_INTERVAL_MS;
    try {
      const pollUrl = new URL(this.base, window.location.origin);
      pollUrl.searchParams.set('role', this.role);
      pollUrl.searchParams.set('since', String(this.since));
      const res = await fetch(pollUrl.toString(), {
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.ok) {
        this.consecutiveFailures = 0;
        const json = (await res.json()) as { messages?: SignalMessage[] };
        const messages = json.messages ?? [];
        const latestRemoteOfferSeq = messages.reduce(
          (latest, message) =>
            message.from !== this.role && message.kind === 'offer'
              ? Math.max(latest, message.seq)
              : latest,
          0,
        );
        for (const m of messages) {
          this.since = Math.max(this.since, m.seq);
          if (m.from === this.role) continue;
          // Un reconnect riparte dalla history per recuperare l'offerta, ma deve
          // applicare soltanto l'epoch più recente presente nello stesso batch.
          if (m.kind === 'offer' && m.seq < latestRemoteOfferSeq) continue;
          await this.onMessage(m);
        }
      } else if (TERMINAL_STATUSES.has(res.status)) {
        this.closeTerminal();
        return;
      } else {
        this.consecutiveFailures += 1;
        nextDelay = this.retryDelay(res);
      }
    } catch {
      this.consecutiveFailures += 1;
      nextDelay = this.retryDelay();
    }
    if (!this.stopped && !this.connected) {
      this.timer = setTimeout(() => void this.poll(), nextDelay);
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
