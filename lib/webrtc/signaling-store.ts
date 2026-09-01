import 'server-only';

import {
  executeUpstashPipeline,
  isUpstashRedisConfigured,
} from '@/lib/security/upstash-rest';
import { memoryAppend, memoryList } from '@/lib/webrtc/signaling-memory-store';
import type { SigMsg } from '@/lib/webrtc/signaling-errors';
import {
  SignalingRateLimitError,
  SignalingSessionLimitError,
  SignalingStoreUnavailableError,
} from '@/lib/webrtc/signaling-errors';
export type { SigMsg } from '@/lib/webrtc/signaling-errors';
export {
  SignalingRateLimitError,
  SignalingSessionLimitError,
  SignalingStoreUnavailableError,
} from '@/lib/webrtc/signaling-errors';

/**
 * Store condiviso per il relay di signaling webcam (offer/answer + ICE).
 * In dev usa memoria locale; in prod con Upstash Redis tutte le istanze
 * Lambda/Amplify vedono gli stessi messaggi.
 */

const SESSION_TTL_SEC = 600;
const MAX_MESSAGES = 300;
export const MAX_SIGNALING_RESPONSE_MESSAGES = 50;
export const MAX_SIGNALING_RESPONSE_BYTES = 512 * 1024;
const MAX_REQUESTS_PER_MINUTE = 240;
const KEY_PREFIX = 'webcam:sig:';

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
  quotaSessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): Promise<{ seq: number }> {
  const { seq: seqKey, msgs: msgsKey } = redisKeys(sessionId);
  const totalKey = `${KEY_PREFIX}${encodeURIComponent(quotaSessionId)}:total`;
  const script = [
    "local total = redis.call('INCR', KEYS[1])",
    "redis.call('EXPIRE', KEYS[1], ARGV[1])",
    "if total > tonumber(ARGV[2]) then return -1 end",
    "local seq = redis.call('INCR', KEYS[2])",
    "redis.call('EXPIRE', KEYS[2], ARGV[1])",
    'return seq',
  ].join('\n');
  const [seqRaw] = await upstashPipeline([
    ['EVAL', script, 2, totalKey, seqKey, SESSION_TTL_SEC, MAX_MESSAGES],
  ]);
  const seq = Number(seqRaw);
  if (seq === -1) throw new SignalingSessionLimitError();
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
  quotaSessionId: string,
  role: 'host' | 'guest',
): Promise<void> {
  const [countRaw] = await upstashPipeline([
    ['INCR', rateKey(quotaSessionId, role)],
    ['EXPIRE', rateKey(quotaSessionId, role), 70],
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
  quotaSessionId = sessionId,
): Promise<{ seq: number }> {
  requireProductionStore();
  if (isUpstashRedisConfigured()) {
    try {
      await checkRedisRate(quotaSessionId, from);
      return await redisAppend(sessionId, quotaSessionId, from, kind, data);
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
  return memoryAppend(sessionId, quotaSessionId, from, kind, data);
}

/** Elenca i messaggi con seq > since. */
export async function listSignalingMessages(
  sessionId: string,
  role: 'host' | 'guest',
  since: number,
  quotaSessionId = sessionId,
): Promise<{ exists: boolean; messages: SigMsg[] }> {
  requireProductionStore();
  if (isUpstashRedisConfigured()) {
    try {
      await checkRedisRate(quotaSessionId, role);
      return await redisList(sessionId, since);
    } catch (err) {
      if (err instanceof SignalingRateLimitError) throw err;
      if (process.env.NODE_ENV !== 'development') {
        throw new SignalingStoreUnavailableError('Upstash non disponibile');
      }
      console.warn('[signaling-store] Upstash fallito, fallback in-memory:', err);
    }
  }
  return memoryList(sessionId, quotaSessionId, role, since);
}
