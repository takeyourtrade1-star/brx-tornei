import { z } from 'zod';
import { selectionSchema } from './selection';

/** Input creazione torneo (MVP: buy-in fisso "For Fun", Heads-Up = 2 giocatori). */
export const createTournamentSchema = selectionSchema.extend({
  bestOf: z.enum(['BO1', 'BO3', 'BO5']),
  isPrivate: z.preprocess(
    (val) => val === true || val === 'true' || val === 'on',
    z.boolean().default(false),
  ),
  // "Giochi con un amico?": true = P2P diretto (IP visibili tra i due peer,
  // zero costo relay); false = video forzato sul TURN (IP oscurati).
  withFriend: z.preprocess(
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
  // Deck facoltativo: stringa vuota = "Ignora deck".
  deckId: z.string().default(''),
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;