import 'server-only';

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
const KEY_PREFIX = 'webcam:sig:';

interface MemorySession {
  seq: number;
  messages: SigMsg[];
  createdAt: number;
}

const memoryStore: Map<string, MemorySession> =
  (globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig ??
  new Map<string, MemorySession>();
(globalThis as unknown as { __webcamSig?: Map<string, MemorySession> }).__webcamSig =
  memoryStore;

function memoryGc(): void {
  const now = Date.now();
  for (const [id, s] of memoryStore) {
    if (now - s.createdAt > SESSION_TTL_SEC * 1000) memoryStore.delete(id);
  }
}

function memoryAppend(
  sessionId: string,
  from: 'host' | 'guest',
  kind: string,
  data: unknown,
): { seq: number } {
  memoryGc();
  let s = memoryStore.get(sessionId);
  if (!s) {
    s = { seq: 0, messages: [], createdAt: Date.now() };
    memoryStore.set(sessionId, s);
  }
  s.seq += 1;
  s.messages.push({ seq: s.seq, from, kind, data });
  if (s.messages.length > MAX_MESSAGES) {
    s.messages.splice(0, s.messages.length - MAX_MESSAGES);
  }
  return { seq: s.seq };
}

function memoryList(sessionId: string, since: number): { exists: boolean; messages: SigMsg[] } {
  const s = memoryStore.get(sessionId);
  if (!s) return { exists: false, messages: [] };
  return { exists: true, messages: s.messages.filter((m) => m.seq > since) };
}

function redisKeys(sessionId: string): { seq: string; msgs: string } {
  const safe = encodeURIComponent(sessionId);
  return { seq: `${KEY_PREFIX}${safe}:seq`, msgs: `${KEY_PREFIX}${safe}:msgs` };
}

function upstashConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashPipeline(commands: (string | number)[][]): Promise<unknown[]> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(commands),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(`Upstash pipeline ${res.status}`);
  }
  const json = (await res.json()) as unknown;
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
  const payload = JSON.stringify({ seq, from, kind, data: data ?? null });
  await upstashPipeline([
    ['RPUSH', msgsKey, payload],
    ['EXPIRE', msgsKey, SESSION_TTL_SEC],
    ['LTRIM', msgsKey, -MAX_MESSAGES, -1],
  ]);
  return { seq };
}

async function redisList(
  sessionId: string,
  since: number,
): Promise<{ exists: boolean; messages: SigMsg[] }> {
  const { seq: seqKey, msgs: msgsKey } = redisKeys(sessionId);
  const [existsRaw, raw] = await upstashPipeline([
    ['EXISTS', seqKey],
    ['LRANGE', msgsKey, 0, -1],
  ]);
  const exists = Number(existsRaw) > 0;
  if (!exists || !Array.isArray(raw) || raw.length === 0) {
    return { exists, messages: [] };
  }
  const messages: SigMsg[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    try {
      const parsed = JSON.parse(item) as SigMsg;
      if (parsed.seq > since) messages.push(parsed);
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
  if (upstashConfigured()) {
    try {
      return await redisAppend(sessionId, from, kind, data);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[signaling-store] Upstash fallito, fallback in-memory:', err);
      }
    }
  }
  return memoryAppend(sessionId, from, kind, data);
}

/** Elenca i messaggi con seq > since. */
export async function listSignalingMessages(
  sessionId: string,
  since: number,
): Promise<{ exists: boolean; messages: SigMsg[] }> {
  if (upstashConfigured()) {
    try {
      return await redisList(sessionId, since);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[signaling-store] Upstash fallito, fallback in-memory:', err);
      }
    }
  }
  return memoryList(sessionId, since);
}
