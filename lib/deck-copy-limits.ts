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

/** Carte con "A deck can have any number of cards named …" nel testo oracle. */
const UNLIMITED_COPY_NAMES = new Set([
  'relentless rats',
  'rat colony',
  'shadowborn apostle',
  'persistent petitioners',
  "dragon's approach",
  'slime against humanity',
  'hare apparent',
  'templar knight',
  'cid, timeless artificer',
]);

/** Carte con un limite copie speciale stampato sulla carta. */
const SPECIAL_COPY_LIMITS = new Map<string, number>([
  ['seven dwarves', 7],
  ['nazgûl', 9],
  ['nazgul', 9],
]);

/** Nessun limite pratico (terre base, carte "any number"). */
export const UNLIMITED_COPIES = 999;

export function isBasicLandName(name: string): boolean {
  return BASIC_LAND_NAMES.has(name.trim().toLowerCase());
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function getOracleKey(card: Pick<DeckCard, 'oracleId' | 'name'>): string {
  return card.oracleId ?? normalizeName(card.name);
}

export type CopyLimitCard = Pick<DeckCard, 'name' | 'oracleId' | 'tournamentLegalities'>;

/**
 * Limite copie totali (main + side) per una carta nel formato.
 * Ordine: terre base e "any number" → nessun limite; limiti stampati sulla carta
 * (che valgono anche in Commander, regola 903.5b); ristretta nel formato → 1;
 * altrimenti 1 in Commander, 4 negli altri formati.
 */
export function getMaxCopiesForCard(formatId: FormatId, card: CopyLimitCard): number {
  const name = normalizeName(card.name);
  if (isBasicLandName(name) || UNLIMITED_COPY_NAMES.has(name)) return UNLIMITED_COPIES;

  const special = SPECIAL_COPY_LIMITS.get(name);
  if (special !== undefined) return special;

  if (card.tournamentLegalities?.[formatId] === 'restricted') return 1;

  return formatId === 'commander' ? 1 : 4;
}

function sameOracleCards(cards: DeckCard[], oracleKey: string): DeckCard[] {
  return cards.filter((c) => getOracleKey(c) === oracleKey);
}

/**
 * Limite effettivo per un gruppo oracle: il minimo tra la carta richiesta e le
 * copie già nel mazzo (una stampa arricchita da Scryfall può sapere di essere
 * ristretta mentre un'altra non ancora).
 */
function getEffectiveMaxCopies(
  formatId: FormatId,
  card: CopyLimitCard,
  group: DeckCard[]
): number {
  return Math.min(
    getMaxCopiesForCard(formatId, card),
    ...group.map((c) => getMaxCopiesForCard(formatId, c))
  );
}

/** Quante copie aggiuntive si possono mettere nel mazzo per questa carta. */
export function getRemainingCopies(
  formatId: FormatId,
  card: CopyLimitCard,
  main: DeckCard[],
  side: DeckCard[]
): number {
  const oracleKey = getOracleKey(card);
  const group = [...sameOracleCards(main, oracleKey), ...sameOracleCards(side, oracleKey)];
  const used = group.reduce((sum, c) => sum + c.quantity, 0);
  const max = getEffectiveMaxCopies(formatId, card, group);
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
  const group = [...sameOracleCards(main, oracleKey), ...sameOracleCards(side, oracleKey)];
  const max = getEffectiveMaxCopies(formatId, card, group);
  const otherSection = section === 'main' ? side : main;
  const inOtherSection = sameOracleCards(otherSection, oracleKey).reduce(
    (sum, c) => sum + c.quantity,
    0
  );
  return Math.max(0, max - inOtherSection);
}
