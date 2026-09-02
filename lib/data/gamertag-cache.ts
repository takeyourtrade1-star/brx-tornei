import 'server-only';

/**
 * Micro-cache del gamertag (GET /api/v1/players/me/profile), keyed per access
 * token — stesso pattern di `lib/auth/session-cache.ts`.
 *
 * Il profilo era l'endpoint piu' caldo del sito: il toast delle sfide lo
 * rileggeva ogni 3 secondi e ogni refresh RSC della lobby ne aggiungeva un
 * altro, ~26 letture/minuto per tab, tutte in uscita dallo stesso IP del
 * frontend. Il gamertag e' immutabile per sessione (cambia solo via
 * `postSetGamertag`, che invalida la entry), quindi rileggerlo a quel ritmo
 * bruciava il rate limit per-IP e il 429 risultante faceva cadere l'RSC.
 *
 * Le entry restano leggibili come "stale" oltre la scadenza: durante un 429 o
 * un 5xx transitorio serve un gamertag noto per non buttare giu' la pagina
 * (vedi `lib/auth/require-gamertag.ts`).
 */

const POSITIVE_TTL_MS = 5 * 60_000;
const NEGATIVE_TTL_MS = 5_000;
const STALE_TTL_MS = 30 * 60_000;
const MAX_ENTRIES = 64;

interface CacheEntry {
  value: string | null;
  expiresAt: number;
  staleUntil: number;
}

const entries = new Map<string, CacheEntry>();

function read(token: string): CacheEntry | null {
  const entry = entries.get(token);
  if (!entry) return null;
  if (entry.staleUntil <= Date.now()) {
    entries.delete(token);
    return null;
  }
  return entry;
}

/** Valore ancora fresco: evita del tutto la chiamata al backend. */
export function getCachedGamertag(token: string): { value: string | null } | null {
  const entry = read(token);
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return { value: entry.value };
}

/**
 * Ultimo valore noto anche se scaduto. Da usare SOLO come fallback su errore
 * transitorio del backend: un 429 non e' un cambio di profilo.
 */
export function getStaleGamertag(token: string): { value: string | null } | null {
  const entry = read(token);
  return entry ? { value: entry.value } : null;
}

export function setCachedGamertag(token: string, value: string | null): void {
  if (entries.size >= MAX_ENTRIES && !entries.has(token)) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  const now = Date.now();
  entries.set(token, {
    value,
    expiresAt: now + (value ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
    staleUntil: now + STALE_TTL_MS,
  });
}

/** Invalidazione immediata dopo una mutazione del profilo. */
export function clearCachedGamertag(token: string): void {
  entries.delete(token);
}

/** Solo per i test: azzera lo stato del modulo tra i casi. */
export function resetGamertagCache(): void {
  entries.clear();
}
