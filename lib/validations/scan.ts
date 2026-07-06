import { z } from 'zod';

export const resolveScanSchema = z.object({
  cardName: z.string().min(1, 'Nome carta obbligatorio'),
  setCode: z.string().optional().nullable(),
  setName: z.string().optional().nullable(),
  collectorNumber: z.string().optional().nullable(),
  scryfallId: z.string().optional().nullable(),
  imageUri: z.string().url().optional().nullable(),
  searchQuery: z.string().optional(),
});

export type ResolveScanInput = z.infer<typeof resolveScanSchema>;
