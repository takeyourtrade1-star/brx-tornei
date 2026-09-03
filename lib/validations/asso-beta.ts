import { z } from 'zod';

export const assoBetaRequestSchema = z.object({
  notes: z
    .string()
    .max(500, 'Le note non possono superare 500 caratteri.')
    .optional()
    .nullable(),
});

export type AssoBetaRequestInput = z.infer<typeof assoBetaRequestSchema>;
