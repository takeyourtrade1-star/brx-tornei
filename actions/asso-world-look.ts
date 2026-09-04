'use server';

import { getSession } from '@/lib/auth/session';
import {
  fetchAssoWorldLook,
  updateAssoWorldLook,
} from '@/lib/data/asso-world-look-client';
import { assoWorldLookSchema } from '@/lib/validations/asso-world-look';
import type { AssoWorldLook } from '@/types/asso-world';

export interface AssoWorldLookActionState {
  ok: boolean;
  data?: AssoWorldLook;
  error?: string;
}

function actionError(error: unknown, fallback: string): AssoWorldLookActionState {
  return {
    ok: false,
    error: error instanceof Error ? error.message : fallback,
  };
}

export async function getAssoWorldLookAction(): Promise<AssoWorldLookActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  try {
    return { ok: true, data: await fetchAssoWorldLook() };
  } catch (error) {
    return actionError(error, 'Impossibile leggere la personalizzazione Asso World.');
  }
}

export async function saveAssoWorldLookAction(
  input: unknown,
): Promise<AssoWorldLookActionState> {
  const session = await getSession();
  if (!session) return { ok: false, error: 'Sessione non valida.' };

  const parsed = assoWorldLookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Personalizzazione Asso World non valida.' };
  }

  try {
    return { ok: true, data: await updateAssoWorldLook(parsed.data) };
  } catch (error) {
    return actionError(error, 'Impossibile salvare la personalizzazione Asso World.');
  }
}
