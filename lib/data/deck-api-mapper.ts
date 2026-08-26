import { z } from 'zod';
import { MODES } from '@/lib/data/catalog';
import { deckCardSchema } from '@/lib/validations/deck-actions';
import { createDeckSchema } from '@/lib/validations/deck';
import type { Deck } from '@/types/deck';

const modeIds = [MODES[0].id, ...MODES.slice(1).map((mode) => mode.id)] as const;

const legalityIssueSchema = z.object({
  blueprintId: z.number().int().nonnegative(),
  cardName: z.string().min(1).max(256),
  formatId: createDeckSchema.shape.formatId,
  status: z.enum(['legal', 'not_legal', 'restricted', 'banned']),
  message: z.string().min(1).max(512),
});

const optionalDateSchema = z
  .string()
  .datetime({ offset: true })
  .nullish()
  .transform((value) => value ?? undefined);

const deckApiSchema = z.object({
  id: z.string().min(1),
  name: createDeckSchema.shape.name,
  formatId: createDeckSchema.shape.formatId,
  archetypeId: createDeckSchema.shape.archetypeId,
  main: z.array(deckCardSchema).max(250),
  side: z.array(deckCardSchema).max(100),
  createdAt: z.string().datetime({ offset: true }),
  modeId: z.enum(modeIds).nullish().transform((value) => value ?? undefined),
  verificationStatus: z.enum(['none', 'declared', 'scanned', 'verified', 'mismatch']),
  lastVerifiedAt: optionalDateSchema,
  legalityCheckedAt: optionalDateSchema,
  legalityErrors: z
    .array(legalityIssueSchema)
    .max(250)
    .nullish()
    .transform((value) => value ?? undefined),
});

export function mapDeckFromApi(payload: unknown): Deck | null {
  const parsed = deckApiSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

export function mapDeckListFromApi(payload: unknown): Deck[] | null {
  if (!Array.isArray(payload)) return null;
  const decks: Deck[] = [];
  for (const item of payload) {
    const deck = mapDeckFromApi(item);
    if (!deck) return null;
    decks.push(deck);
  }
  return decks;
}
