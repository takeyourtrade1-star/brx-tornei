import { z } from 'zod';

export const arcadeAccessSchema = z.object({
  password: z
    .string({ required_error: 'Inserisci la password della Sala Arcade.' })
    .min(1, 'Inserisci la password della Sala Arcade.')
    .max(256, 'Password non valida.'),
});
