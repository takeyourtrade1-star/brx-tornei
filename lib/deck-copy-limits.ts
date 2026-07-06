import type { FormatId } from '@/lib/data/catalog';
import type { DeckCard } from '@/types/deck';

const BASIC_LAND_NAMES = new Set([
  'plains',
  'island',
  'swamp',
  'mountain',
  'forest',
  'wastes',
  'snow-covered plains',
  'snow-covered island',
  'snow-covered swamp',
  'snow-covered mountain',
  'snow-covered forest',
]);

export function isBasicLandName(name: string): boolean {
  return BASIC_LAND_NAMES.has(name.trim().toLowerCase());
}

export function getOracleKey(card: Pick<DeckCard, 'oracleId' | 'name'>): string {
  return card.oracleId ?? card.name.trim().toLowerCase();
}

/** Limite copie per oracle nel mazzo (allineato a lib/deck-legality.ts). */
export function getMaxCopiesForOracle(formatId: FormatId, oracleKey: string): number {
  if (isBasicLandName(oracleKey)) return 999;
  return formatId === 'commander' ? 1 : 4;
}

function countOracleInSection(cards: DeckCard[], oracleKey: string): number {
  return cards
    .filter((c) => getOracleKey(c) === oracleKey)
    .reduce((sum, c) => sum + c.quantity, 0);
}

/** Quante copie aggiuntive si possono mettere nel mazzo per questa carta. */
export function getRemainingCopies(
  formatId: FormatId,
  card: Pick<DeckCard, 'oracleId' | 'name'>,
  main: DeckCard[],
  side: DeckCard[]
): number {
  const oracleKey = getOracleKey(card);
  const max = getMaxCopiesForOracle(formatId, oracleKey);
  const used = countOracleInSection(main, oracleKey) + countOracleInSection(side, oracleKey);
  return Math.max(0, max - used);
}

/** Max quantità modificabile per una riga già nel mazzo (main o side). */
export function getMaxQuantityForDeckRow(
  formatId: FormatId,
  card: DeckCard,
  main: DeckCard[],
  side: DeckCard[],
  section: 'main' | 'side'
): number {
  const oracleKey = getOracleKey(card);
  const max = getMaxCopiesForOracle(formatId, oracleKey);
  const inMain = countOracleInSection(main, oracleKey);
  const inSide = countOracleInSection(side, oracleKey);
  const inOtherSection = section === 'main' ? inSide : inMain;
  return Math.max(0, max - inOtherSection);
}
