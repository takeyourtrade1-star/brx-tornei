import { z } from 'zod';
import { FORMATS, MODES, type FormatId, type ModeId } from '@/lib/data/catalog';

const formatIds = FORMATS.map((f) => f.id) as [FormatId, ...FormatId[]];
const availableModeIds = MODES.filter((m) => m.available).map((m) => m.id) as [
  ModeId,
  ...ModeId[],
];

/** Solo formati espliciti (creazione tavolo, mazzi, ecc.). */
export const formatIdSchema = z.enum(formatIds);

/** Formato esplicito oppure filtro aggregato "Tutti". */
export type FormatFilter = FormatId | 'all';

/** Selezione completa richiesta dalla dashboard (/tornei?format=..&mode=..). */
export const selectionSchema = z.object({
  format: z.union([formatIdSchema, z.literal('all')]),
  mode: z.enum(availableModeIds), // le modalità "presto in arrivo" non sono selezionabili
});

export type Selection = z.infer<typeof selectionSchema>;

const lobbyFocusTableSchema = z
  .string()
  .trim()
  .min(1)
  .max(128);

/**
 * Azioni di rientro nella lobby avviate da superfici secondarie (es. Sala
 * Arcade). Restano query opzionali e non cambiano la selezione del torneo.
 */
export const lobbyFocusSchema = z.object({
  tableId: lobbyFocusTableSchema.optional(),
  create: z.literal('1').optional(),
});

export type LobbyFocus = z.infer<typeof lobbyFocusSchema>;

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

export function parseLobbyFocus(
  searchParams: Record<string, string | string[] | undefined>,
): LobbyFocus {
  const result = lobbyFocusSchema.safeParse({
    tableId: searchParams.focusTable,
    create: searchParams.focusCreate,
  });
  return result.success ? result.data : {};
}
