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
export type SignalKind = 'offer' | 'answer' | 'candidate' | 'bye';

export interface SignalMessage {
  seq: number;
  from: SignalRole;
  kind: SignalKind;
  data: unknown;
}

const POLL_INTERVAL_MS = 600;
const REQUEST_TIMEOUT_MS = 8_000;

export class SignalingChannel {
  private base: string;
  private role: SignalRole;
  private since = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private connected = false;
  private stopped = false;
  private onMessage: (m: SignalMessage) => void;

  constructor(
    sessionId: string,
    role: SignalRole,
    onMessage: (m: SignalMessage) => void,
    basePath?: string,
  ) {
    this.base =
      basePath ?? `/api/tornei/webcam/${encodeURIComponent(sessionId)}`;
    this.role = role;
    this.onMessage = onMessage;
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
    try {
      await fetch(this.base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: this.role, kind, data }),
        keepalive: kind === 'bye',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      /* best-effort: il prossimo poll recupera lo stato */
    }
  }

  private async poll(): Promise<void> {
    if (this.stopped || this.connected) return;
    try {
      const res = await fetch(`${this.base}?role=${this.role}&since=${this.since}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (res.ok) {
        const json = (await res.json()) as { messages?: SignalMessage[] };
        for (const m of json.messages ?? []) {
          this.since = Math.max(this.since, m.seq);
          if (m.from !== this.role) this.onMessage(m);
        }
      }
    } catch {
      /* errore di rete: si riprova al prossimo tick */
    }
    if (!this.stopped && !this.connected) {
      this.timer = setTimeout(() => void this.poll(), POLL_INTERVAL_MS);
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
