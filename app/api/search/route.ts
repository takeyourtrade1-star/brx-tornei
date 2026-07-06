/**
 * GET /api/search — ricerca catalogo Meilisearch (server-side).
 * Allineato a new_frontend_brx/app/api/search/route.ts con attributi extra per i mazzi.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMeilisearchServerConfig } from '@/lib/meilisearch-server-env';
import {
  MeiliFetchError,
  escapeMeiliFilterValue,
  fetchMeiliWithTimeout,
  normalizeCategoryId,
  normalizeCategoryIds,
  normalizeGameSlug,
  normalizeLimit,
  normalizePage,
  normalizeQuery,
  normalizeSetName,
  normalizeSort,
  publicStatusForMeiliStatus,
} from '@/lib/search/search-request-utils';
import type { SearchApiResponse, SearchHit } from '@/types/search';

const SEARCH_ATTRIBUTES_TO_RETRIEVE = [
  'id',
  'name',
  'set_name',
  'set_code',
  'set_icon_uri',
  'game_slug',
  'category_id',
  'category_name',
  'image',
  'keywords_localized',
  'rarity',
  'collector_number',
  'available_languages',
  'oracle_id',
  'scryfall_id',
  'cardtrader_id',
] as const;

function buildFilter(
  game: string,
  set: string,
  categoryId: number | null,
  categoryIds: number[]
): string[] {
  const parts: string[] = [];
  if (game) parts.push(`game_slug = "${game}"`);
  if (set) parts.push(`set_name = "${escapeMeiliFilterValue(set)}"`);

  if (categoryIds.length > 0) {
    if (categoryIds.length === 1) {
      parts.push(`category_id = ${categoryIds[0]}`);
    } else {
      parts.push(`category_id IN [${categoryIds.join(', ')}]`);
    }
  } else if (categoryId != null) {
    parts.push(`category_id = ${categoryId}`);
  }

  return parts;
}

function buildSort(sortBy: string): string[] {
  switch (sortBy) {
    case 'relevance':
      return [];
    case 'name_asc':
      return ['name:asc'];
    case 'name_desc':
      return ['name:desc'];
    case 'set_asc':
      return ['set_name:asc'];
    case 'set_desc':
      return ['set_name:desc'];
    case 'price_asc':
    case 'price_desc':
      return ['name:asc'];
    default:
      return ['name:asc'];
  }
}

export async function GET(request: NextRequest) {
  const { url: MEILI_URL, apiKey: MEILI_KEY, index: INDEX } = getMeilisearchServerConfig();

  if (!MEILI_URL || !MEILI_KEY) {
    return NextResponse.json(
      { error: 'Meilisearch non configurato (MEILISEARCH_URL / MEILISEARCH_API_KEY)' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = normalizeQuery(searchParams.get('q'));
  const game = normalizeGameSlug(searchParams.get('game'));
  const set = normalizeSetName(searchParams.get('set'));
  const categoryId = normalizeCategoryId(searchParams.get('category_id'));
  const categoryIds = normalizeCategoryIds(searchParams.get('category_ids'));
  const page = normalizePage(searchParams.get('page'));
  const limit = normalizeLimit(searchParams.get('limit'));
  const sortBy = normalizeSort(searchParams.get('sort'));

  const offset = (page - 1) * limit;
  const filterParts = buildFilter(game, set, categoryId, categoryIds);
  const filter = filterParts.length ? filterParts.join(' AND ') : undefined;
  const sort = buildSort(sortBy);

  const searchUrl = `${MEILI_URL}/indexes/${INDEX}/search`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${MEILI_KEY}`,
  };

  const doSearch = (includeSort: boolean) => {
    const body: Record<string, unknown> = {
      q: q || undefined,
      limit,
      offset,
      attributesToRetrieve: [...SEARCH_ATTRIBUTES_TO_RETRIEVE],
    };
    if (filter) body.filter = filter;
    if (includeSort && sort.length > 0) body.sort = sort;
    return fetchMeiliWithTimeout(searchUrl, { method: 'POST', headers, body: JSON.stringify(body) });
  };

  try {
    let res = await doSearch(true);
    if (res.status === 400) {
      res = await doSearch(false);
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Meilisearch error: ${res.status}` },
        { status: publicStatusForMeiliStatus(res.status) }
      );
    }

    const data = (await res.json()) as {
      hits: SearchHit[];
      estimatedTotalHits?: number;
    };

    const hits = Array.isArray(data.hits) ? data.hits : [];
    const total =
      typeof data.estimatedTotalHits === 'number' ? data.estimatedTotalHits : hits.length;
    const totalPages = Math.ceil(total / limit) || 1;

    const response: SearchApiResponse = {
      hits,
      total,
      page,
      limit,
      totalPages,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    if (err instanceof MeiliFetchError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: 'Ricerca non disponibile', detail: message },
      { status: 502 }
    );
  }
}
