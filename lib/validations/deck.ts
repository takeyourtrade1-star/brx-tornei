import { z } from 'zod';
import { FORMATS } from '@/lib/data/catalog';
import { DECK_ARCHETYPES } from '@/lib/data/deck-archetypes';

const formatIds = [FORMATS[0].id, ...FORMATS.slice(1).map((f) => f.id)] as const;
const archetypeIds = [DECK_ARCHETYPES[0].id, ...DECK_ARCHETYPES.slice(1).map((a) => a.id)] as const;

export const createDeckSchema = z.object({
  name: z
    .string()
    .min(1, 'Inserisci un nome per il mazzo')
    .max(60, 'Il nome è troppo lungo'),
  formatId: z.enum(formatIds, {
    message: 'Seleziona un formato valido',
  }),
  archetypeId: z.enum(archetypeIds, {
    message: 'Seleziona una tipologia valida',
  }),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
