import 'server-only';

import { createHash } from 'node:crypto';
import {
  executeUpstashPipeline,
  getUpstashRedisConfig,
} from '@/lib/security/upstash-rest';

export class ServerRateLimitExceeded extends Error {}
export class ServerRateLimitUnavailable extends Error {}

interface RateLimitOptions {
  scope: string;
  subject: string;
  limit: number;
  windowSeconds?: number;
  requireDistributedStore?: boolean;
}

interface MemoryCounter {
  count: number;
  expiresAt: number;
}

const memoryCounters = new Map<string, MemoryCounter>();
const MAX_MEMORY_KEYS = 5_000;
let memoryFallbackWarningShown = false;

/**
 * Stessa eccezione temporanea per-instance del sito principale
 * (new_frontend_brx/docs/RATE_LIMITING.md): solo in assenza totale di Upstash
 * si usa il limiter in memoria, con un unico warning e senza IP/segreti.
 */
function warnProductionMemoryFallbackOnce(): void {
  if (memoryFallbackWarningShown) return;
  memoryFallbackWarningShown = true;
  console.warn('[rate-limit] Upstash non configurato: fallback temporaneo per-instance attivo.');
}

const RATE_LIMIT_SCRIPT = [
  "local count = redis.call('INCR', KEYS[1])",
  "local ttl = redis.call('TTL', KEYS[1])",
  "if count == 1 or ttl < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  'return count',
].join('\n');

function rateKey(scope: string, subject: string, windowSeconds: number): string {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const subjectHash = createHash('sha256').update(subject).digest('hex').slice(0, 24);
  return `ratelimit:${scope}:${subjectHash}:${bucket}`;
}

function enforceMemory(key: string, limit: number, windowSeconds: number): void {
  const now = Date.now();
  const current = memoryCounters.get(key);
  if (!current || current.expiresAt <= now) {
    if (memoryCounters.size >= MAX_MEMORY_KEYS) {
      const oldestKey = memoryCounters.keys().next().value;
      if (oldestKey !== undefined) memoryCounters.delete(oldestKey);
    }
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
  requireDistributedStore = false,
}: RateLimitOptions): Promise<void> {
  const key = rateKey(scope, subject, windowSeconds);
  let redisConfigured = false;
  try {
    redisConfigured = getUpstashRedisConfig() !== null;
  } catch {
    // Configurazione parziale o invalida: mai fallback silenzioso.
    if (process.env.NODE_ENV === 'production') {
      throw new ServerRateLimitUnavailable('Upstash non configurato correttamente');
    }
  }
  if (!redisConfigured) {
    if (requireDistributedStore && process.env.NODE_ENV === 'production') {
      throw new ServerRateLimitUnavailable(
        'Rate limit distribuito obbligatorio ma non configurato',
      );
    }
    if (process.env.NODE_ENV === 'production') {
      warnProductionMemoryFallbackOnce();
    }
    enforceMemory(key, limit, windowSeconds);
    return;
  }

  try {
    const payload = await executeUpstashPipeline(
      [
        ['EVAL', RATE_LIMIT_SCRIPT, '1', key, String(windowSeconds + 10)],
      ],
      3_000,
    );
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
