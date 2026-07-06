'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { getMyInventory } from '@/lib/data/inventory';
import { resolveScanAndAddToInventory } from '@/lib/data/resolve-scan';
import { resolveScanSchema } from '@/lib/validations/scan';
import type { ResolveScanResult } from '@/types/resolve-scan';

export async function addScannedCardAction(
  input: unknown
): Promise<{ data: ResolveScanResult } | { error: string }> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta. Accedi di nuovo.' };
  }

  const parsed = resolveScanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Dati scan non validi.' };
  }

  const inventory = await getMyInventory(session.user.id);
  const result = await resolveScanAndAddToInventory(
    session.user.id,
    parsed.data,
    inventory
  );

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath('/mazzi');
  revalidatePath('/tornei');
  return { data: result.data };
}
