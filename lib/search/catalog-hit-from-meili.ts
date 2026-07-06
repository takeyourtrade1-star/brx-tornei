import type { CardCatalogHit } from '@/types/card';
import type { SearchHit } from '@/types/search';

/** Converte un hit Meilisearch nel tipo catalogo usato nei mazzi. */
export function searchHitToCatalogHit(hit: SearchHit): CardCatalogHit {
  const blueprintId =
    hit.cardtrader_id ??
    (typeof hit.id === 'string' && /^\d+$/.test(hit.id) ? Number(hit.id) : hit.id);

  return {
    id: String(blueprintId),
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
