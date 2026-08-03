import 'server-only';

import {
  executeUpstashPipeline,
  isUpstashRedisConfigured,
} from '@/lib/security/upstash-rest';

/**
 * Store condiviso per il relay di signaling webcam (offer/answer + ICE).
 * In dev usa memoria locale; in prod con Upstash Redis tutte le istanze
 * Lambda/Amplify vedono gli stessi messaggi.
 */

export interface SigMsg {
  seq: number;
  from: 'host' | 'guest';
  kind: string;
  data: unknown;
}

const SESSION_TTL_SEC = 600;
const MAX_MESSAGES = 300;
export const MAX_SIGNALING_RESPONSE_MESSAGES = 50;
export const MAX_SIGNALING_RESPONSE_BYTES = 512 * 1024;
const MAX_ACTIVE_MEMORY_SESSIONS = 200;
const MAX_REQUESTS_PER_MINUTE = 240;
const KEY_PREFIX = 'webcam:sig:';

export class SignalingStoreUnavailableError extends Error {}
export class SignalingRateLimitError extends Error {}
export class SignalingSessionLimitError extends Error {}

interface MemorySession {
  seq: number;
  messages: SigMsg[];
  createdAt: number;
}

interface MemoryRate {
  count: number;
  resetAt: number;
}

const memoryStore: Map<string, MemorySession> =
  (globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig ??
  new Map<string, MemorySession>();
(globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig =
  memoryStore;
const memoryRates = new Map<string, MemoryRate>();

function memoryGc(): void {
  const now = Date.now();
  for (const [id, s] of memoryStore) {
    if (now - s.createdAt > SESSION_TTL_SEC * 1000) memoryStore.delete(id);
  }
  for (const [key, rate] of memoryRates) {
    if (rate.resetAt <= now) memoryRates.delete(key);
  }
}

function checkMemoryRate(sessionId: string, role: 'host' | 'guest'): void {
  memoryGc();
  const key = `${sessionId}:${role}`;
  const now = Date.now();
  const current = memoryRates.get(key);
  if (!current || current.resetAt <= now) {
    memoryRates.set(key, { count: 1, resetAt: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS_PER_MINUTE) {
    throw new SignalingRateLimitError();
  }
}

function memoryAppend(
  sessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): { seq: number } {
  checkMemoryRate(sessionId, from);
  let s = memoryStore.get(sessionId);
  if (!s) {
    if (memoryStore.size >= MAX_ACTIVE_MEMORY_SESSIONS) {
      throw new SignalingStoreUnavailableError('Troppe sessioni webcam attive');
    }
    s = { seq: 0, messages: [], createdAt: Date.now() };
    memoryStore.set(sessionId, s);
  }
  if (s.seq >= MAX_MESSAGES) throw new SignalingSessionLimitError();
  s.seq += 1;
  s.messages.push({ seq: s.seq, from, kind, data });
  return { seq: s.seq };
}

function memoryList(
  sessionId: string,
  role: 'host' | 'guest',
  since: number,
): { exists: boolean; messages: SigMsg[] } {
  checkMemoryRate(sessionId, role);
  const s = memoryStore.get(sessionId);
  if (!s) return { exists: false, messages: [] };
  const messages: SigMsg[] = [];
  let responseBytes = 0;
  for (const message of s.messages) {
    if (message.seq <= since) continue;
    const size = Buffer.byteLength(JSON.stringify(message), 'utf8');
    if (responseBytes + size > MAX_SIGNALING_RESPONSE_BYTES) break;
    messages.push(message);
    responseBytes += size;
    if (messages.length >= MAX_SIGNALING_RESPONSE_MESSAGES) break;
  }
  return { exists: true, messages };
}

function redisKeys(sessionId: string): { seq: string; msgs: string } {
  const safe = encodeURIComponent(sessionId);
  return { seq: `${KEY_PREFIX}${safe}:seq`, msgs: `${KEY_PREFIX}${safe}:msgs` };
}

function rateKey(sessionId: string, role: 'host' | 'guest'): string {
  const minute = Math.floor(Date.now() / 60_000);
  return `${KEY_PREFIX}${encodeURIComponent(sessionId)}:rate:${role}:${minute}`;
}

async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const json = await executeUpstashPipeline(commands);
  if (Array.isArray(json)) {
    return json.map((row) => (row as { result: unknown }).result);
  }
  if (
    json &&
    typeof json === 'object' &&
    'result' in json &&
    Array.isArray((json as { result: unknown }).result)
  ) {
    return (json as { result: { result: unknown }[] }).result.map((row) => row.result);
  }
  throw new Error('Risposta Upstash pipeline non riconosciuta');
}

async function redisAppend(
  sessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): Promise<{ seq: number }> {
  const { seq: seqKey, msgs: msgsKey } = redisKeys(sessionId);
  const [seqRaw] = await upstashPipeline([
    ['INCR', seqKey],
    ['EXPIRE', seqKey, SESSION_TTL_SEC],
  ]);
  const seq = Number(seqRaw);
  if (!Number.isFinite(seq) || seq < 1) {
    throw new Error('Upstash INCR non valido');
  }
  if (seq > MAX_MESSAGES) throw new SignalingSessionLimitError();
  const payload = JSON.stringify({ seq, from, kind, data: data ?? null });
  await upstashPipeline([
    ['RPUSH', msgsKey, payload],
    ['EXPIRE', msgsKey, SESSION_TTL_SEC],
    ['LTRIM', msgsKey, -MAX_MESSAGES, -1],
  ]);
  return { seq };
}

async function checkRedisRate(
  sessionId: string,
  role: 'host' | 'guest',
): Promise<void> {
  const [countRaw] = await upstashPipeline([
    ['INCR', rateKey(sessionId, role)],
    ['EXPIRE', rateKey(sessionId, role), 70],
  ]);
  if (Number(countRaw) > MAX_REQUESTS_PER_MINUTE) {
    throw new SignalingRateLimitError();
  }
}

function requireProductionStore(): void {
  if (process.env.NODE_ENV === 'production' && !isUpstashRedisConfigured()) {
    throw new SignalingStoreUnavailableError('Upstash non configurato');
  }
}

async function redisList(
  sessionId: string,
  since: number,
): Promise<{ exists: boolean; messages: SigMsg[] }> {
  const { seq: seqKey, msgs: msgsKey } = redisKeys(sessionId);
  const [existsRaw, raw] = await upstashPipeline([
    ['EXISTS', seqKey],
    ['LRANGE', msgsKey, since, since + MAX_SIGNALING_RESPONSE_MESSAGES - 1],
  ]);
  const exists = Number(existsRaw) > 0;
  if (!exists || !Array.isArray(raw) || raw.length === 0) {
    return { exists, messages: [] };
  }
  const messages: SigMsg[] = [];
  let responseBytes = 0;
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const size = Buffer.byteLength(item, 'utf8');
    if (responseBytes + size > MAX_SIGNALING_RESPONSE_BYTES) break;
    try {
      const parsed = JSON.parse(item) as SigMsg;
      if (parsed.seq > since) {
        messages.push(parsed);
        responseBytes += size;
      }
    } catch {
      /* messaggio corrotto: si ignora */
    }
  }
  return { exists: true, messages };
}

/** Aggiunge un messaggio di signaling alla sessione. */
export async function appendSignalingMessage(
  sessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): Promise<{ seq: number }> {
  requireProductionStore();
  if (isUpstashRedisConfigured()) {
    try {
      await checkRedisRate(sessionId, from);
      return await redisAppend(sessionId, from, kind, data);
    } catch (err) {
      if (
        err instanceof SignalingRateLimitError ||
        err instanceof SignalingSessionLimitError
      ) throw err;
      if (process.env.NODE_ENV !== 'development') {
        throw new SignalingStoreUnavailableError('Upstash non disponibile');
      }
      console.warn('[signaling-store] Upstash fallito, fallback in-memory:', err);
    }
  }
  return memoryAppend(sessionId, from, kind, data);
}

/** Elenca i messaggi con seq > since. */
export async function listSignalingMessages(
  sessionId: string,
  role: 'host' | 'guest',
  since: number,
): Promise<{ exists: boolean; messages: SigMsg[] }> {
  requireProductionStore();
  if (isUpstashRedisConfigured()) {
    try {
      await checkRedisRate(sessionId, role);
      return await redisList(sessionId, since);
    } catch (err) {
      if (err instanceof SignalingRateLimitError) throw err;
      if (process.env.NODE_ENV !== 'development') {
        throw new SignalingStoreUnavailableError('Upstash non disponibile');
      }
      console.warn('[signaling-store] Upstash fallito, fallback in-memory:', err);
    }
  }
  return memoryList(sessionId, role, since);
}
