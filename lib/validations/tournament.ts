import { z } from 'zod';
import { selectionSchema } from './selection';

/** Input creazione torneo (MVP: buy-in fisso "For Fun", Heads-Up = 2 giocatori). */
export const createTournamentSchema = selectionSchema.extend({
  bestOf: z.enum(['BO1', 'BO3', 'BO5']),
  isPrivate: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
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

export const joinTournamentSchema = z.object({
  tournamentId: z.string().min(1),
  deckId: z.string().min(1, 'Seleziona un mazzo'),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;