import { z } from 'zod';

/**
 * Segnalazione di partita con testo libero (input per la moderazione).
 * Stesso contratto del backend: 5-500 caratteri, testo ripulito dai
 * caratteri di controllo prima della validazione.
 */
export const matchReportSchema = z.object({
  message: z
    .string()
    .trim()
    .min(5, 'Descrivi il problema con almeno 5 caratteri.')
    .max(500, 'La segnalazione può essere lunga al massimo 500 caratteri.'),
});

export type MatchReportInput = z.infer<typeof matchReportSchema>;
