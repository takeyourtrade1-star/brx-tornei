import { z } from 'zod';
import { selectionSchema } from './selection';

/** Input creazione torneo (MVP: buy-in fisso "For Fun", Heads-Up = 2 giocatori). */
export const createTournamentSchema = selectionSchema.extend({
  bestOf: z.enum(['BO1', 'BO3', 'BO5']),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
