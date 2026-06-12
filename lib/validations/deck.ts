import { z } from 'zod';
import { FORMATS, type FormatId } from '@/lib/data/catalog';
import type { DeckCardEntry } from '@/types/deck';

const formatIds = FORMATS.map((f) => f.id) as [FormatId, ...FormatId[]];

export const SIDEBOARD_SIZE = 15;

export function getMinMainDeckSize(format: FormatId): number {
  return format === 'commander' ? 100 : 60;
}

export function countDeckCards(entries: DeckCardEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.quantity, 0);
}

const deckCardEntrySchema = z.object({
  cardId: z.string().min(1),
  name: z.string().min(1, 'Nome carta obbligatorio'),
  quantity: z.number().int().min(1).max(4),
  colors: z.array(z.string()),
});

const createDeckBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Inserisci un nome per il mazzo')
    .max(80, 'Il nome può avere al massimo 80 caratteri'),
  format: z.enum(formatIds),
  main: z.array(deckCardEntrySchema),
  sideboard: z.array(deckCardEntrySchema),
});

export const createDeckSchema = createDeckBaseSchema.superRefine((data, ctx) => {
    const minMain = getMinMainDeckSize(data.format);
    const mainCount = countDeckCards(data.main);

    if (mainCount < minMain) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Il main deck richiede almeno ${minMain} carte`,
        path: ['main'],
      });
    }

    const sideCount = countDeckCards(data.sideboard);
    if (sideCount !== SIDEBOARD_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Il sideboard deve contenere esattamente ${SIDEBOARD_SIZE} carte`,
        path: ['sideboard'],
      });
    }
  });

export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export type BuilderStepId = 'info' | 'main' | 'side' | 'confirm';

const deckNameSchema = createDeckBaseSchema.pick({ name: true });
const deckFormatSchema = createDeckBaseSchema.pick({ format: true });

/** Validazione per singolo step del builder (client-side). */
export function validateDeckBuilderStep(
  step: BuilderStepId,
  input: unknown
): { success: true } | { success: false; error: string } {
  const data = input as CreateDeckInput;

  if (step === 'info') {
    const nameResult = deckNameSchema.safeParse({ name: data.name });
    if (!nameResult.success) {
      return { success: false, error: nameResult.error.issues[0]?.message ?? 'Nome non valido' };
    }
    const formatResult = deckFormatSchema.safeParse({ format: data.format });
    if (!formatResult.success) {
      return { success: false, error: formatResult.error.issues[0]?.message ?? 'Formato non valido' };
    }
    return { success: true };
  }

  if (step === 'main') {
    const minMain = getMinMainDeckSize(data.format);
    const mainCount = countDeckCards(data.main);
    if (mainCount < minMain) {
      return {
        success: false,
        error: `Aggiungi almeno ${minMain} carte al main deck (attualmente ${mainCount})`,
      };
    }
    return { success: true };
  }

  if (step === 'side') {
    const sideCount = countDeckCards(data.sideboard);
    if (sideCount !== SIDEBOARD_SIZE) {
      return {
        success: false,
        error: `Il sideboard deve avere ${SIDEBOARD_SIZE} carte (attualmente ${sideCount})`,
      };
    }
    return { success: true };
  }

  return validateCreateDeckInput(input);
}

/** Validazione completa per submit (client + server). */
export function validateCreateDeckInput(
  input: unknown
): { success: true; data: CreateDeckInput } | { success: false; error: string } {
  const result = createDeckSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const first = result.error.issues[0];
  return { success: false, error: first?.message ?? 'Dati del mazzo non validi' };
}
