/**
 * POST /api/cards-by-blueprints
 * Body: { ids: number[] }
 *
 * Restituisce una mappa blueprint_id -> CardCatalogHit per una lista di ID.
 * Utile per arricchire le carte già presenti in un mazzo senza rifare la ricerca.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCardsByBlueprintIds } from '@/lib/data/catalog-cards';
import type { BlueprintToCardMap } from '@/lib/data/catalog-cards';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let ids: unknown;
  try {
    const body = (await request.json()) as { ids?: unknown };
    ids = body.ids;
  } catch {
    return NextResponse.json({ error: 'JSON non valido' }, { status: 400 });
  }

  const blueprintIds = Array.isArray(ids)
    ? ids
        .map((n) => (typeof n === 'string' ? Number(n) : n))
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0)
    : [];

  if (blueprintIds.length === 0) {
    return NextResponse.json({ hits: {} });
  }

  const map: BlueprintToCardMap = await getCardsByBlueprintIds(blueprintIds);
  return NextResponse.json({ hits: map });
}
