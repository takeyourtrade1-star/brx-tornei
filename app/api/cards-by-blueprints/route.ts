/**
 * POST /api/cards-by-blueprints
 * Body: { ids: number[] }
 *
 * Restituisce una mappa blueprint_id -> CardCatalogHit per una lista di ID.
 * Utile per arricchire le carte già presenti in un mazzo senza rifare la ricerca.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { config } from '@/lib/config';
import { getCardsByBlueprintIds } from '@/lib/data/catalog-cards';
import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';
import type { BlueprintToCardMap } from '@/lib/data/catalog-cards';

export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 8 * 1024;
const MAX_BLUEPRINT_IDS = 100;

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json(
      { error: 'Richiesta cross-site rifiutata' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return NextResponse.json(
      { error: 'Content-Type non supportato' },
      { status: 415, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Non autenticato' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    await enforceServerRateLimit({
      scope: 'cards-by-blueprints',
      subject: session.user.id,
      limit: 60,
    });
  } catch (error) {
    const status = statusForServerRateLimitError(error);
    return NextResponse.json(
      { error: status === 429 ? 'Troppe richieste' : 'Servizio non disponibile' },
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          ...(status === 429 ? { 'Retry-After': '60' } : {}),
        },
      },
    );
  }

  const decoded = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!decoded.ok) {
    return NextResponse.json(
      { error: decoded.status === 413 ? 'Payload troppo grande' : 'JSON non valido' },
      { status: decoded.status, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  const body = decoded.value && typeof decoded.value === 'object'
    ? decoded.value as { ids?: unknown }
    : {};
  const ids = body.ids;

  if (!Array.isArray(ids) || ids.length > MAX_BLUEPRINT_IDS) {
    return NextResponse.json(
      { error: `ids deve contenere al massimo ${MAX_BLUEPRINT_IDS} elementi` },
      { status: 422, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const blueprintIds = Array.isArray(ids)
    ? ids
        .map((n) => (typeof n === 'string' ? Number(n) : n))
        .filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0)
    : [];

  if (blueprintIds.length === 0) {
    return NextResponse.json(
      { hits: {} },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const map: BlueprintToCardMap = await getCardsByBlueprintIds(blueprintIds);
  return NextResponse.json(
    { hits: map },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
