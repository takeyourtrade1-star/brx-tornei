import 'server-only';

import { createHash } from 'node:crypto';

export class ServerRateLimitExceeded extends Error {}
export class ServerRateLimitUnavailable extends Error {}

interface RateLimitOptions {
  scope: string;
  subject: string;
  limit: number;
  windowSeconds?: number;
}

interface MemoryCounter {
  count: number;
  expiresAt: number;
}

const memoryCounters = new Map<string, MemoryCounter>();

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  return url && token ? { url: url.replace(/\/+$/, ''), token } : null;
}

function rateKey(scope: string, subject: string, windowSeconds: number): string {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const subjectHash = createHash('sha256').update(subject).digest('hex').slice(0, 24);
  return `ratelimit:${scope}:${subjectHash}:${bucket}`;
}

function enforceMemory(key: string, limit: number, windowSeconds: number): void {
  const now = Date.now();
  const current = memoryCounters.get(key);
  if (!current || current.expiresAt <= now) {
    memoryCounters.set(key, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new ServerRateLimitExceeded();
}

export function statusForServerRateLimitError(error: unknown): 429 | 503 {
  return error instanceof ServerRateLimitExceeded ? 429 : 503;
}

export async function enforceServerRateLimit({
  scope,
  subject,
  limit,
  windowSeconds = 60,
}: RateLimitOptions): Promise<void> {
  const key = rateKey(scope, subject, windowSeconds);
  const redis = redisConfig();
  if (!redis) {
    if (process.env.NODE_ENV === 'production') {
      throw new ServerRateLimitUnavailable('Upstash non configurato');
    }
    enforceMemory(key, limit, windowSeconds);
    return;
  }

  try {
    const response = await fetch(`${redis.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redis.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds + 10],
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) throw new Error(`Upstash ${response.status}`);
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) throw new Error('Risposta Upstash non valida');
    const first = payload[0] as { result?: unknown } | undefined;
    const count = Number(first?.result);
    if (!Number.isFinite(count)) throw new Error('Contatore Upstash non valido');
    if (count > limit) throw new ServerRateLimitExceeded();
  } catch (error) {
    if (error instanceof ServerRateLimitExceeded) throw error;
    if (process.env.NODE_ENV === 'production') {
      throw new ServerRateLimitUnavailable('Upstash non disponibile');
    }
    enforceMemory(key, limit, windowSeconds);
  }
}
