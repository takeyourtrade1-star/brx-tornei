'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { enrollUserInTournament } from '@/lib/data/enrollment';
import { createTournament } from '@/lib/data/tournaments';
import { createTournamentSchema } from '@/lib/validations/tournament';
import { z } from 'zod';

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
    buyIn: formData.get('buyIn') ?? 'for_fun',
    bestOf: formData.get('bestOf'),
    maxPlayers: formData.get('maxPlayers'),
    visibility: formData.get('visibility'),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Dati del torneo non validi';
    return { error: message };
  }

  await createTournament(parsed.data, {
    id: session.user.id,
    username: session.user.name ?? session.user.email,
  });

  revalidatePath('/tornei');
  redirect(`/tornei?format=${parsed.data.format}&mode=${parsed.data.mode}`);
}

const enrollSchema = z.object({
  tournamentId: z.string().min(1, 'Torneo non valido'),
});

export interface EnrollActionState {
  error?: string;
  success?: boolean;
}

/** Iscrizione a un torneo con controllo sessione, validazione e anti-overlap. */
export async function enrollInTournamentAction(
  tournamentId: string
): Promise<EnrollActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione scaduta: effettua di nuovo il login.' };
  }

  const parsed = enrollSchema.safeParse({ tournamentId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Torneo non valido' };
  }

  const result = await enrollUserInTournament(session.user.id, parsed.data.tournamentId, {
    id: session.user.id,
    username: session.user.name ?? session.user.email,
  });

  if (result.error) return { error: result.error };

  revalidatePath('/tornei');
  revalidatePath('/partite');
  return { success: true };
}
