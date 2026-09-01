import type { SigMsg } from '@/lib/webrtc/signaling-errors';
import {
  SignalingRateLimitError,
  SignalingSessionLimitError,
  SignalingStoreUnavailableError,
} from '@/lib/webrtc/signaling-errors';

const SESSION_TTL_MS = 10 * 60 * 1_000;
const MAX_MESSAGES = 300;
const MAX_SESSIONS = 200;
const MAX_REQUESTS_PER_MINUTE = 240;
const MAX_RESPONSE_MESSAGES = 50;
const MAX_RESPONSE_BYTES = 512 * 1024;

interface MemorySession {
  seq: number;
  messages: SigMsg[];
  createdAt: number;
}

interface MemoryCounter {
  count: number;
  resetAt: number;
}

const sessions: Map<string, MemorySession> =
  (globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig ??
  new Map<string, MemorySession>();
(globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig = sessions;
const rates = new Map<string, MemoryCounter>();
const totals = new Map<string, MemoryCounter>();

function collectExpired(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
  for (const [key, counter] of [...rates, ...totals]) {
    if (counter.resetAt <= now) {
      rates.delete(key);
      totals.delete(key);
    }
  }
}

function chargeRequest(quotaSessionId: string, role: 'host' | 'guest'): void {
  collectExpired();
  const key = `${quotaSessionId}:${role}`;
  const current = rates.get(key);
  if (!current || current.resetAt <= Date.now()) {
    rates.set(key, { count: 1, resetAt: Date.now() + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS_PER_MINUTE) throw new SignalingRateLimitError();
}

function chargeMessage(quotaSessionId: string): void {
  const current = totals.get(quotaSessionId);
  if (!current || current.resetAt <= Date.now()) {
    totals.set(quotaSessionId, { count: 1, resetAt: Date.now() + SESSION_TTL_MS });
    return;
  }
  current.count += 1;
  if (current.count > MAX_MESSAGES) throw new SignalingSessionLimitError();
}

export function memoryAppend(
  sessionId: string,
  quotaSessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): { seq: number } {
  chargeRequest(quotaSessionId, from);
  chargeMessage(quotaSessionId);
  let session = sessions.get(sessionId);
  if (!session) {
    if (sessions.size >= MAX_SESSIONS) throw new SignalingStoreUnavailableError();
    session = { seq: 0, messages: [], createdAt: Date.now() };
    sessions.set(sessionId, session);
  }
  if (session.seq >= MAX_MESSAGES) throw new SignalingSessionLimitError();
  session.seq += 1;
  session.messages.push({ seq: session.seq, from, kind, data });
  return { seq: session.seq };
}

export function memoryList(
  sessionId: string,
  quotaSessionId: string,
  role: 'host' | 'guest',
  since: number,
): { exists: boolean; messages: SigMsg[] } {
  chargeRequest(quotaSessionId, role);
  const session = sessions.get(sessionId);
  if (!session) return { exists: false, messages: [] };
  const messages: SigMsg[] = [];
  let bytes = 0;
  for (const message of session.messages) {
    if (message.seq <= since) continue;
    const size = Buffer.byteLength(JSON.stringify(message), 'utf8');
    if (bytes + size > MAX_RESPONSE_BYTES) break;
    messages.push(message);
    bytes += size;
    if (messages.length >= MAX_RESPONSE_MESSAGES) break;
  }
  return { exists: true, messages };
}
