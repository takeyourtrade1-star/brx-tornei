import 'server-only';
import { config } from '@/lib/config';
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
  };
}

/**
 * Recupera i dati catalogo per una lista di blueprint_id (cardtrader_id)
 * interrogando Meilisearch direttamente lato server.
 */
export async function getCardsByBlueprintIds(
  blueprintIds: number[]
): Promise<BlueprintToCardMap> {
  if (!config.meilisearch.host) {
    console.warn('[CatalogCards] MEILISEARCH_URL non configurato');
    return {};
  }

  const uniqueIds = [...new Set(blueprintIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (uniqueIds.length === 0) return {};

  const searchUrl = `${config.meilisearch.host}/indexes/${config.meilisearch.indexName}/search`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (config.meilisearch.apiKey) {
    headers.Authorization = `Bearer ${config.meilisearch.apiKey}`;
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
      signal: AbortSignal.timeout(config.api.timeout),
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
