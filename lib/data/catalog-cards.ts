import 'server-only';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import type { CardCatalogHit } from '@/types/card';

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
  if (!url) return [];

  const searchUrl = `${url}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => null)) as { hits?: MeiliSearchHit[] } | null;
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
  if (!url) {
    console.warn('[CatalogCards] MEILISEARCH_URL non configurato');
    return {};
  }

  const uniqueIds = [...new Set(blueprintIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (uniqueIds.length === 0) return {};

  const searchUrl = `${url}/indexes/${index}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  try {
    const res = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filter: `cardtrader_id IN [${uniqueIds.join(', ')}]`,
        limit: uniqueIds.length,
        attributesToRetrieve: ATTRIBUTES_TO_RETRIEVE,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error(
        `[CatalogCards] Meilisearch errore ${res.status}: ${await res.text().catch(() => '')}`
      );
      return {};
    }

    const data = (await res.json().catch(() => null)) as { hits?: MeiliSearchHit[] } | null;
    const hits = Array.isArray(data?.hits) ? data.hits : [];

    const map: BlueprintToCardMap = {};
    for (const hit of hits) {
      const card = normalizeHit(hit);
      if (!card) continue;
      const blueprintId = Number(card.id);
      if (!Number.isNaN(blueprintId)) {
        map[blueprintId] = card;
      }
    }
    return map;
  } catch (err) {
    console.error('[CatalogCards] Errore fetch catalogo:', err);
    return {};
  }
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
