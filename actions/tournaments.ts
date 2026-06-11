'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth/session';
import { createTournament } from '@/lib/data/tournaments';
import { createTournamentSchema } from '@/lib/validations/tournament';

export interface TournamentActionState {
  error?: string;
  createdId?: string;
}

/**
 * Crea un torneo per la selezione corrente.
 * Regole: sessione obbligatoria (riletta dal cookie, mai dal client),
 * input validato con zod, buy-in forzato a "For Fun" (MVP).
 */
export async function createTournamentAction(
  formData: FormData
): Promise<TournamentActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = createTournamentSchema.safeParse({
    format: formData.get('format'),
    mode: formData.get('mode'),
    bestOf: formData.get('bestOf') ?? 'BO3',
  });
  if (!parsed.success) {
    return { error: 'Selezione non valida' };
  }

  const tournament = await createTournament(parsed.data, {
    id: session.user.id,
    username: session.user.name ?? session.user.email,
  });

  revalidatePath('/tornei');
  return { createdId: tournament.id };
}
