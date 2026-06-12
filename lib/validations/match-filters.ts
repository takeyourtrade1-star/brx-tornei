import { z } from 'zod';

/** Tab filtro per la pagina Le mie partite. */
export const matchTabSchema = z.enum(['attive', 'completate', 'in_attesa']);

export type MatchTab = z.infer<typeof matchTabSchema>;

const TAB_LABELS: Record<MatchTab, string> = {
  attive: 'Attive',
  completate: 'Completate',
  in_attesa: 'In attesa',
};

export const MATCH_TABS = matchTabSchema.options.map((id) => ({
  id,
  label: TAB_LABELS[id],
}));

/**
 * Parsing tollerante del tab dai searchParams.
 * Default: attive.
 */
export function parseMatchTab(
  searchParams: Record<string, string | string[] | undefined>
): MatchTab {
  const raw = searchParams.tab;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const result = matchTabSchema.safeParse(value);
  return result.success ? result.data : 'attive';
}
