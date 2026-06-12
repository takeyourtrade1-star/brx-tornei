import { z } from 'zod';
import { getParticipantPresets } from '@/lib/data/catalog';
import { selectionSchema } from './selection';

const visibilitySchema = z.preprocess(
  (value) => (value === null || value === undefined || value === '' ? 'public' : value),
  z.enum(['public', 'private'])
);

/** Input creazione torneo (MVP: buy-in fisso "For Fun", partecipanti preset per modalità). */
export const createTournamentSchema = selectionSchema
  .extend({
    buyIn: z.literal('for_fun').default('for_fun'),
    bestOf: z.enum(['BO1', 'BO3', 'BO5']),
    maxPlayers: z.coerce.number().int(),
    visibility: visibilitySchema,
  })
  .superRefine((data, ctx) => {
    const allowed = getParticipantPresets(data.mode).map((p) => p.value);
    if (!allowed.includes(data.maxPlayers)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Numero partecipanti non valido per questa modalità',
        path: ['maxPlayers'],
      });
    }
  });

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

/** Validazione client-side del wizard (stesso schema, messaggi in italiano). */
export function validateCreateTournamentInput(
  input: unknown
): { success: true; data: CreateTournamentInput } | { success: false; error: string } {
  const result = createTournamentSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const first = result.error.issues[0];
  return { success: false, error: first?.message ?? 'Dati non validi' };
}
