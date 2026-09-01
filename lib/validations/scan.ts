import { z } from 'zod';

export const resolveScanSchema = z.object({
  cardName: z.string().min(1, 'Nome carta obbligatorio').max(256, 'Nome carta troppo lungo'),
  setCode: z.string().trim().min(1).max(12).regex(/^[a-zA-Z0-9]+$/).optional().nullable(),
  setName: z.string().trim().max(128).optional().nullable(),
  collectorNumber: z.string().trim().min(1).max(32).optional().nullable(),
  scryfallId: z.string().uuid('ID Scryfall non valido').optional().nullable(),
  imageUri: z.preprocess(
    (v) => (v === '' || v == null ? null : v),
    z.string().url().nullable().optional(),
  ),
  searchQuery: z.string().max(256).optional(),
}).strict();

export type ResolveScanInput = z.infer<typeof resolveScanSchema>;
