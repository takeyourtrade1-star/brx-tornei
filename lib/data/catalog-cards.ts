import 'server-only';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import type { CardCatalogHit } from '@/types/card';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';

const MAX_CATALOG_RESPONSE_BYTES = 2 * 1024 * 1024;
const MAX_BLUEPRINT_IDS_PER_BATCH = 200;
const MAX_BLUEPRINT_IDS_PER_CALL = 5_000;
const MAX_CATALOG_ELAPSED_MS = 12_000;

const ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'set_code',
  'image',
  'cardtrader_id',
  'rarity',
  'collector_number',
  'oracle_id',
  'scryfall_id',
];

export type BlueprintToCardMap = Record<number, CardCatalogHit>;

interface MeiliSearchHit {
  id?: string | number;
  name?: string;
  set_name?: string;
  set_code?: string | null;
  image?: string | null;
  cardtrader_id?: number;
  rarity?: string;
  collector_number?: string;
  oracle_id?: string;
  scryfall_id?: string;
}

function escapeMeiliFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeHit(hit: MeiliSearchHit): CardCatalogHit | null {
  const blueprintId =
    hit.cardtrader_id ??
    (typeof hit.id === 'number' ? hit.id : null) ??
    (typeof hit.id === 'string' && /^\d+$/.test(hit.id) ? Number(hit.id) : null);
  if (blueprintId == null || !hit.name) return null;

  return {
    id: String(hit.id ?? blueprintId),
    name: hit.name,
    image: hit.image ?? null,
    setName: hit.set_name,
    setCode: hit.set_code,
    rarity: hit.rarity,
    collectorNumber: hit.collector_number,
    oracleId: hit.oracle_id,
    scryfallId: hit.scryfall_id,
  };
}

async function meiliSearch(body: Record<string, unknown>): Promise<MeiliSearchHit[]> {
  const { url, apiKey, index } = getMeilisearchServerConfig();
  if (!url || !apiKey || !index) return [];

  const searchUrl = `${url}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    const data = (await readBoundedResponseJson(
      res,
      MAX_CATALOG_RESPONSE_BYTES,
    ).catch(() => null)) as { hits?: MeiliSearchHit[] } | null;
    return Array.isArray(data?.hits) ? data.hits : [];
  } catch {
    return [];
  }
}

/**
 * Recupera i dati catalogo per una lista di blueprint_id (cardtrader_id)
 * interrogando Meilisearch direttamente lato server.
 */
export async function getCardsByBlueprintIds(
  blueprintIds: number[]
): Promise<BlueprintToCardMap> {
  const { url, apiKey, index } = getMeilisearchServerConfig();
  if (!url || !apiKey || !index) {
    console.warn('[CatalogCards] MEILISEARCH_URL non configurato');
    return {};
  }

  const uniqueIds = [...new Set(blueprintIds)].filter(
    (n) => Number.isSafeInteger(n) && n > 0,
  );
  if (uniqueIds.length === 0) return {};
  if (uniqueIds.length > MAX_BLUEPRINT_IDS_PER_CALL) {
    console.error('[CatalogCards] Limite ID catalogo superato');
    return {};
  }

  const searchUrl = `${url}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const map: BlueprintToCardMap = {};
  const startedAt = Date.now();
  for (let offset = 0; offset < uniqueIds.length; offset += MAX_BLUEPRINT_IDS_PER_BATCH) {
    const batch = uniqueIds.slice(offset, offset + MAX_BLUEPRINT_IDS_PER_BATCH);
    const remainingMs = MAX_CATALOG_ELAPSED_MS - (Date.now() - startedAt);
    if (remainingMs <= 0) {
      console.error('[CatalogCards] Budget temporale catalogo superato');
      return {};
    }
    try {
      const res = await fetch(searchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          filter: `cardtrader_id IN [${batch.join(', ')}]`,
          limit: batch.length,
          attributesToRetrieve: ATTRIBUTES_TO_RETRIEVE,
        }),
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(Math.min(30_000, remainingMs)),
      });

      if (!res.ok) {
        console.error(`[CatalogCards] Meilisearch errore ${res.status}`);
        return {};
      }

      const data = (await readBoundedResponseJson(
        res,
        MAX_CATALOG_RESPONSE_BYTES,
      ).catch(() => null)) as { hits?: MeiliSearchHit[] } | null;
      const hits = Array.isArray(data?.hits) ? data.hits : [];
      for (const hit of hits) {
        const card = normalizeHit(hit);
        if (!card) continue;
        const blueprintId = hit.cardtrader_id
          ?? (typeof hit.id === 'number' ? hit.id : null)
          ?? (typeof hit.id === 'string' && /^\d+$/.test(hit.id) ? Number(hit.id) : null);
        if (blueprintId !== null && batch.includes(blueprintId)) {
          map[blueprintId] = card;
        }
      }
    } catch {
      console.error('[CatalogCards] Errore fetch catalogo');
      return {};
    }
  }
  return map;
}

/**
 * Cerca una carta nel catalogo per nome + set (usato dopo Camera Match).
 */
export async function searchCardByNameSet(
  cardName: string,
  setCode: string
): Promise<CardCatalogHit | null> {
  const name = cardName.trim();
  const set = setCode.trim().toLowerCase();
  if (!name || !set) return null;

  const filters = [
    `name = "${escapeMeiliFilterValue(name)}"`,
    `set_code = "${escapeMeiliFilterValue(set)}"`,
  ];

  const hits = await meiliSearch({
    filter: filters.join(' AND '),
    limit: 5,
    attributesToRetrieve: ATTRIBUTES_TO_RETRIEVE,
  });

  if (hits.length > 0) {
    return normalizeHit(hits[0]);
  }

  const fuzzyHits = await meiliSearch({
    q: name,
    filter: `set_code = "${escapeMeiliFilterValue(set)}"`,
    limit: 3,
    attributesToRetrieve: ATTRIBUTES_TO_RETRIEVE,
  });

  return fuzzyHits.length > 0 ? normalizeHit(fuzzyHits[0]) : null;
}

/** Cerca una carta nel catalogo per UUID Scryfall (fallback dopo Camera Match). */
export async function searchCardByScryfallId(
  scryfallId: string
): Promise<CardCatalogHit | null> {
  const id = scryfallId.trim();
  if (!id) return null;

  const hits = await meiliSearch({
    filter: `scryfall_id = "${escapeMeiliFilterValue(id)}"`,
    limit: 1,
    attributesToRetrieve: ATTRIBUTES_TO_RETRIEVE,
  });

  return hits.length > 0 ? normalizeHit(hits[0]) : null;
}
