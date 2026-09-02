import 'server-only';

import type { Session } from '@/types/auth';

/**
 * Cache brevissima della validazione sessione (GET /api/auth/me).
 *
 * Il backend Auth applica un rate limit per IP e tutte le chiamate RSC del
 * frontend arrivano dallo stesso IP server-side: il polling del match
 * (router.refresh periodici) può saturare il bucket e trasformare un 429 in
 * un falso logout. La cache è keyed per token: una rotazione del refresh
 * invalida immediatamente le entry precedenti.
 */

const POSITIVE_TTL_MS = 30_000;
const NEGATIVE_TTL_MS = 5_000;
const MAX_ENTRIES = 64;

interface CacheEntry {
  value: Session | null;
  expiresAt: number;
}

const entries = new Map<string, CacheEntry>();

export function getCachedSession(token: string): { value: Session | null } | null {
  const entry = entries.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    entries.delete(token);
    return null;
  }
  return { value: entry.value };
}

export function setCachedSession(
  token: string,
  value: Session | null,
): void {
  if (entries.size >= MAX_ENTRIES && !entries.has(token)) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(token, {
    value,
    expiresAt: Date.now() + (value ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  });
}

/** Un 429/5xx non è un logout: serve solo attendere il bucket. */
export function isTransientAuthStatus(status: number): boolean {
  return status === 429 || status >= 500;
}
