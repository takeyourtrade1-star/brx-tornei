import { z } from 'zod';
import { isPlaymatId } from '@/lib/playmats';
import { createDeckSchema } from './deck';

const legalityStatusSchema = z.enum(['legal', 'not_legal', 'restricted', 'banned']);

const tournamentLegalitiesSchema = z.object({
  standard: legalityStatusSchema,
  pioneer: legalityStatusSchema,
  modern: legalityStatusSchema,
  legacy: legalityStatusSchema,
  pauper: legalityStatusSchema,
  commander: legalityStatusSchema,
  premodern: legalityStatusSchema,
  'old-school': legalityStatusSchema,
}).partial().transform((value) => ({
  standard: value.standard ?? 'not_legal',
  pioneer: value.pioneer ?? 'not_legal',
  modern: value.modern ?? 'not_legal',
  legacy: value.legacy ?? 'not_legal',
  pauper: value.pauper ?? 'not_legal',
  commander: value.commander ?? 'not_legal',
  premodern: value.premodern ?? 'not_legal',
  'old-school': value['old-school'] ?? 'not_legal',
}));

const blueprintIdSchema = z.string().trim().max(16).refine((value) => {
  if (!/^[1-9]\d*$/.test(value)) return false;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0;
}, 'Carta non valida.');

/**
 * Confine browser -> server: i metadati di catalogo/Scryfall vengono ignorati.
 * Zod rimuove le chiavi sconosciute e il server ricostruisce la carta dall'id.
 */
export const deckCardInputSchema = z.object({
  id: blueprintIdSchema,
  quantity: z.number().int().min(1).max(100),
  isCommander: z.boolean().optional(),
});

/** Schema difensivo per le carte restituite dal Tournament Service. */
export const deckCardSchema = z.object({
  id: blueprintIdSchema,
  name: z.string().min(1).max(256),
  quantity: z.number().int().min(1).max(100),
  image: z.string().max(2048).nullable().optional(),
  setName: z.string().max(256).optional(),
  setCode: z.string().max(32).nullable().optional(),
  rarity: z.string().max(64).optional(),
  collectorNumber: z.string().max(64).optional(),
  oracleId: z.string().max(128).optional(),
  scryfallId: z.string().max(128).optional(),
  tournamentLegalities: tournamentLegalitiesSchema.optional(),
  isCommander: z.boolean().optional(),
});

export const updateDeckSchema = z.object({
  deckId: z.string().min(1).max(128),
  main: z.array(deckCardInputSchema).max(250).optional(),
  side: z.array(deckCardInputSchema).max(100).optional(),
});

export const confirmDeckSchema = updateDeckSchema.extend({
  main: z.array(deckCardInputSchema).max(250),
  side: z.array(deckCardInputSchema).max(100),
});

export const validateLegalitySchema = z.object({
  deckId: z.string().min(1).max(128).optional(),
  formatId: createDeckSchema.shape.formatId.optional(),
  deckSnapshot: z
    .object({
      formatId: createDeckSchema.shape.formatId,
      main: z.array(deckCardInputSchema).max(250),
      side: z.array(deckCardInputSchema).max(100),
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
