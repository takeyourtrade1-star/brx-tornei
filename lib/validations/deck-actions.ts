import { z } from 'zod';
import { isPlaymatId } from '@/lib/playmats';
import { createDeckSchema } from './deck';

export const deckCardSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(256),
  quantity: z.number().int().min(1).max(100),
  image: z.string().max(2048).nullable().optional(),
  setName: z.string().max(256).optional(),
  setCode: z.string().max(32).nullable().optional(),
  rarity: z.string().max(64).optional(),
  collectorNumber: z.string().max(64).optional(),
  oracleId: z.string().max(128).optional(),
  scryfallId: z.string().max(128).optional(),
});

export const updateDeckSchema = z.object({
  deckId: z.string().min(1),
  main: z.array(deckCardSchema).max(250).optional(),
  side: z.array(deckCardSchema).max(100).optional(),
});

export const validateLegalitySchema = z.object({
  deckId: z.string().optional(),
  formatId: z.string().optional(),
  deckSnapshot: z
    .object({
      formatId: z.string(),
      main: z.array(deckCardSchema).max(250),
      side: z.array(deckCardSchema).max(100),
    })
    .optional(),
});

export const saveVerificationSchema = z.object({
  deckId: z.string().min(1),
  scannedEntries: z
    .array(
      z.object({
        blueprintId: z.number().int().positive(),
        cardName: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1)
    .max(250),
});

export const defaultPlaymatSchema = z.object({
  playmatId: z.string().refine(isPlaymatId, 'Seleziona un tappetino valido.'),
});

export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;
