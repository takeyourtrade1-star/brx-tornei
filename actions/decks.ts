'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { createDeck } from '@/lib/data/decks';
import { createDeckSchema } from '@/lib/validations/deck';
import { selectionQuery } from '@/lib/validations/selection';

export interface DeckActionState {
  error?: string;
  createdId?: string;
}

/**
 * Crea un mazzo per l'utente corrente.
 * Sessione riletta dal cookie, input validato con zod.
 */
export async function createDeckAction(formData: FormData): Promise<DeckActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  let main: unknown;
  let sideboard: unknown;
  try {
    main = JSON.parse(String(formData.get('main') ?? '[]'));
    sideboard = JSON.parse(String(formData.get('sideboard') ?? '[]'));
  } catch {
    return { error: 'Formato carte non valido.' };
  }

  const parsed = createDeckSchema.safeParse({
    name: formData.get('name'),
    format: formData.get('format'),
    main,
    sideboard,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Dati del mazzo non validi';
    return { error: message };
  }

  await createDeck(session.user.id, parsed.data);

  revalidatePath('/mazzi');
  redirect(`/mazzi${selectionQuery({ format: parsed.data.format, mode: 'heads-up' })}`);
}
