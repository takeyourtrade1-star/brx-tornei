export type DecklistSection = 'main' | 'side';

export interface DecklistEntry {
  name: string;
  quantity: number;
  section: DecklistSection;
}

const SECTION_MARKERS = /^(sideboard|side deck|side)$/i;
const MAIN_MARKERS = /^(main deck|main|deck)$/i;
const SET_SUFFIX = /\s+\([A-Za-z0-9_-]{2,10}\)\s*(?:[A-Za-z0-9-]+)?\s*$/;
const CARD_TAG_SUFFIX = /\s+\*(?:CMDR|F|E)\*\s*$/i;

function normalizeName(name: string): string {
  return name.replace(CARD_TAG_SUFFIX, '').replace(SET_SUFFIX, '').trim();
}

/**
 * Legge i formati più comuni esportati dai deck builder:
 * `4 Lightning Bolt`, `4x Lightning Bolt` e `SB: 2 Negate`.
 */
export function parseDecklist(input: string): DecklistEntry[] {
  const entries = new Map<string, DecklistEntry>();
  let currentSection: DecklistSection = 'main';

  for (const rawLine of input.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) continue;

    if (SECTION_MARKERS.test(line.replace(/:$/, ''))) {
      currentSection = 'side';
      continue;
    }
    if (MAIN_MARKERS.test(line.replace(/:$/, ''))) {
      currentSection = 'main';
      continue;
    }

    let section = currentSection;
    if (/^SB:/i.test(line)) {
      section = 'side';
      line = line.replace(/^SB:\s*/i, '');
    }

    const match = line.match(/^(\d{1,3})\s*x?\s+(.+)$/i);
    if (!match) continue;
    const quantity = Math.min(999, Number(match[1]));
    const name = normalizeName(match[2] ?? '');
    if (!name || quantity < 1) continue;

    const key = `${section}:${name.toLocaleLowerCase('en')}`;
    const existing = entries.get(key);
    entries.set(key, {
      name,
      quantity: Math.min(999, quantity + (existing?.quantity ?? 0)),
      section,
    });
  }

  return [...entries.values()];
}
