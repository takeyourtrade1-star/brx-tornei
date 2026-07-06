import { z } from 'zod';
import { createDeckSchema } from './deck';

export const deckCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  image: z.string().nullable().optional(),
  setName: z.string().optional(),
  setCode: z.string().nullable().optional(),
  rarity: z.string().optional(),
  collectorNumber: z.string().optional(),
  oracleId: z.string().optional(),
  scryfallId: z.string().optional(),
});

export const updateDeckSchema = z.object({
  deckId: z.string().min(1),
  main: z.array(deckCardSchema).optional(),
  side: z.array(deckCardSchema).optional(),
});

export const validateLegalitySchema = z.object({
  deckId: z.string().optional(),
  formatId: z.string().optional(),
  deckSnapshot: z
    .object({
      formatId: z.string(),
      main: z.array(deckCardSchema),
      side: z.array(deckCardSchema),
    })
    .optional(),
});

export const saveVerificationSchema = z.object({
  deckId: z.string().min(1),
  status: z.enum(['verified', 'mismatch', 'scanned']),
  scannedEntries: z
    .array(
      z.object({
        blueprintId: z.number().int().positive(),
        cardName: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .optional(),
});

export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
