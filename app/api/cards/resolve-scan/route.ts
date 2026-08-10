import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getMyInventory } from '@/lib/data/inventory';
import { resolveScanAndAddToInventory } from '@/lib/data/resolve-scan';
import { resolveScanSchema } from '@/lib/validations/scan';
import { config } from '@/lib/config';
import { isJsonContentType, readBoundedJson } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  if (!config.features.ephemeralInventoryMutations) {
    return NextResponse.json({ error: 'Inventory writes unavailable' }, { status: 503 });
  }

  try {
    await enforceServerRateLimit({
      scope: 'resolve-scan',
      subject: session.user.id,
      limit: 10,
    });
  } catch (error) {
    const status = statusForServerRateLimitError(error);
    return NextResponse.json(
      { error: status === 429 ? 'Troppe scansioni' : 'Servizio non disponibile' },
      {
        status,
        headers: {
          'Cache-Control': 'no-store',
          ...(status === 429 ? { 'Retry-After': '60' } : {}),
        },
      },
    );
  }

  const decoded = await readBoundedJson(request, 32 * 1024);
  if (!decoded.ok) {
    return NextResponse.json(
      { error: decoded.status === 413 ? 'Payload troppo grande' : 'Body JSON non valido' },
      { status: decoded.status },
    );
  }

  const parsed = resolveScanSchema.safeParse(decoded.value);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Dati non validi' },
      { status: 400 }
    );
  }

  const inventory = await getMyInventory(session.user.id);
  const result = await resolveScanAndAddToInventory(
    session.user.id,
    parsed.data,
    inventory
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result.data, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
