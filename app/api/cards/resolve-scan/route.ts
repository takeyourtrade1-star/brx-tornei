import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getMyInventory } from '@/lib/data/inventory';
import { resolveScanAndAddToInventory } from '@/lib/data/resolve-scan';
import { resolveScanSchema } from '@/lib/validations/scan';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const parsed = resolveScanSchema.safeParse(body);
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

  return NextResponse.json(result.data);
}
