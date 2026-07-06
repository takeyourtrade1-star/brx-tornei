/**
 * Validazione e normalizzazione condivisa per le route handler di ricerca Meilisearch.
 * Allineato a new_frontend_brx/lib/search/search-request-utils.ts
 */

export const MAX_QUERY_LENGTH = 200;
export const MAX_LIMIT = 60;
export const DEFAULT_LIMIT = 20;
export const MAX_CATEGORY_IDS = 20;
export const MAX_IDS_BATCH = 100;
export const MAX_AUTOCOMPLETE_REQUESTS = 4;
export const MEILI_FETCH_TIMEOUT_MS = 8000;

export const ALLOWED_GAME_SLUGS = new Set([
  'mtg',
  'pokemon',
  'pk',
  'one-piece',
  'op',
  'yugioh',
]);

export const ALLOWED_SORTS = new Set([
  'relevance',
  'name_asc',
  'name_desc',
  'set_asc',
  'set_desc',
  'price_asc',
  'price_desc',
]);

export const ALLOWED_ID_FILTER_FIELDS = new Set(['cardtrader_id', 'id']);

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function normalizeQuery(raw: string | null | undefined): string {
  if (!raw) return '';
  let result = '';
  for (let i = 0; i < raw.length; i += 1) {
    const code = raw.charCodeAt(i);
    if (code <= 31 || code === 127) continue;
    result += raw[i];
  }
  return result.trim().slice(0, MAX_QUERY_LENGTH);
}

export function normalizeGameSlug(raw: string | null | undefined): string {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return '';
  return ALLOWED_GAME_SLUGS.has(value) ? value : '';
}

export function normalizeSetName(raw: string | null | undefined): string {
  return (raw ?? '').trim().slice(0, 200);
}

export function normalizePage(raw: string | null | undefined): number {
  const parsed = parseInt(raw ?? '', 10);
  return clampInt(Number.isNaN(parsed) ? 1 : parsed, 1, 100000);
}

export function normalizeLimit(
  raw: string | null | undefined,
  fallback: number = DEFAULT_LIMIT,
  max: number = MAX_LIMIT
): number {
  const parsed = parseInt(raw ?? '', 10);
  return clampInt(Number.isNaN(parsed) ? fallback : parsed, 1, max);
}

export function normalizeSort(raw: string | null | undefined): string {
  const value = (raw ?? '').trim();
  return ALLOWED_SORTS.has(value) ? value : 'name_asc';
}

export function normalizeCategoryIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const ids = raw
    .split(',')
    .map((part) => parseInt(part.trim(), 10))
    .filter((id) => Number.isInteger(id) && id > 0 && id < 1_000_000);
  return Array.from(new Set(ids)).slice(0, MAX_CATEGORY_IDS);
}

export function normalizeCategoryId(raw: string | null | undefined): number | null {
  const parsed = parseInt((raw ?? '').trim(), 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed >= 1_000_000) return null;
  return parsed;
}

export function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function normalizeIdList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const ids = raw
    .map((value) => (typeof value === 'number' ? value : parseInt(String(value).trim(), 10)))
    .filter((id) => Number.isInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER);
  return Array.from(new Set(ids)).slice(0, MAX_IDS_BATCH);
}

export function normalizeIdFilterField(raw: unknown, fallback = 'cardtrader_id'): string {
  const value = typeof raw === 'string' ? raw.trim() : '';
  return ALLOWED_ID_FILTER_FIELDS.has(value) ? value : fallback;
}

export class MeiliFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'MeiliFetchError';
    this.status = status;
  }
}

export async function fetchMeiliWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = MEILI_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new MeiliFetchError('Meilisearch timeout', 504);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function publicStatusForMeiliStatus(status: number): number {
  if (status === 504) return 504;
  if (status >= 500) return 503;
  return 502;
}
