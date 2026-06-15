/**
 * GET /api/inventory
 * Restituisce l'inventario dell'utente loggato, arricchito con i dati catalogo.
 * Il token viene letto dal cookie HttpOnly lato server: il client non lo gestisce mai.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getMyInventory } from '@/lib/data/inventory';
import type { InventoryItem } from '@/types/inventory';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Sessione non valida' }, { status: 401 });
  }

  const items = await getMyInventory(session.user.id);

  return NextResponse.json(
    { items },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    }
  );
}
