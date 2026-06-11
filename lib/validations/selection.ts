import { z } from 'zod';
import { FORMATS, MODES, type FormatId, type ModeId } from '@/lib/data/catalog';

const formatIds = FORMATS.map((f) => f.id) as [FormatId, ...FormatId[]];
const availableModeIds = MODES.filter((m) => m.available).map((m) => m.id) as [
  ModeId,
  ...ModeId[],
];

/** Selezione completa richiesta dalla dashboard (/tornei?format=..&mode=..). */
export const selectionSchema = z.object({
  format: z.enum(formatIds),
  mode: z.enum(availableModeIds), // le modalità "presto in arrivo" non sono selezionabili
});

export type Selection = z.infer<typeof selectionSchema>;

/**
 * Parsing tollerante dei searchParams (server-side).
 * Ritorna null se la selezione è assente o invalida → la pagina fa redirect allo step giusto.
 */
export function parseSelection(
  searchParams: Record<string, string | string[] | undefined>
): Selection | null {
  const result = selectionSchema.safeParse({
    format: searchParams.format,
    mode: searchParams.mode,
  });
  return result.success ? result.data : null;
}
