import type { FormatId } from '@/lib/data/catalog';

/** Sintesi compatte usate soltanto dalla UI dei mazzi. */
export const DECK_FORMAT_META: Record<FormatId, { hint: string }> = {
  'old-school': { hint: '1993–1997' },
  premodern: { hint: '1995–2003' },
  pioneer: { hint: 'Dal 2012' },
  modern: { hint: 'Dal 2003' },
  standard: { hint: 'Rotazione' },
  legacy: { hint: 'Eterno' },
  pauper: { hint: 'Solo comuni' },
  commander: { hint: '100 carte' },
};
