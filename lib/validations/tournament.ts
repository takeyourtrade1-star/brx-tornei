import { z } from 'zod';
import { formatIdSchema, selectionSchema } from './selection';

/** Input creazione torneo (MVP: buy-in fisso "For Fun", Heads-Up = 2 giocatori). */
export const createTournamentSchema = selectionSchema.omit({ format: true }).extend({
  format: formatIdSchema,
  bestOf: z.enum(['BO1', 'BO3', 'BO5']),
  isPrivate: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
  // Per ora resta solo "Sfida i tuoi amici": il server action invia sempre
  // true e il backend rifiuta la modalità normale.
  withFriend: z.literal(true),
  isTournament: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
  enableScryfallCheck: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
  enablePhysicalVerification: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
});

const declaredDeckIdSchema = z.string({
  required_error: 'Dichiara il mazzo con cui vuoi partecipare.',
  invalid_type_error: 'Dichiara il mazzo con cui vuoi partecipare.',
})
  .trim()
  .min(1, 'Dichiara il mazzo con cui vuoi partecipare.')
  .max(128);

export const createTableSchema = createTournamentSchema.extend({
  deckId: declaredDeckIdSchema,
});

export const joinTournamentSchema = z.object({
  tournamentId: z.string().min(1).max(128),
  deckId: declaredDeckIdSchema,
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;
