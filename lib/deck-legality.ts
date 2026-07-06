import type { FormatId } from '@/lib/data/catalog';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { isLegalInFormatStatus, legalityLabel } from '@/lib/card-legality-label';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck, DeckCard } from '@/types/deck';

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

function isBasicLand(name: string): boolean {
  return BASIC_LAND_NAMES.has(name.trim().toLowerCase());
}

function countByOracle(cards: DeckCard[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const card of cards) {
    const key = card.oracleId ?? card.name.toLowerCase();
    map.set(key, (map.get(key) ?? 0) + card.quantity);
  }
  return map;
}

function checkCardFormatLegality(
  card: DeckCard,
  formatId: FormatId,
  section: 'main' | 'side'
): DeckLegalityIssue | null {
  const legalities = card.tournamentLegalities;
  if (!legalities) {
    return {
      blueprintId: Number(card.id),
      cardName: card.name,
      formatId,
      status: 'not_legal',
      message: `${card.name}: legalità non verificata (Scryfall)`,
    };
  }
  const status = legalities[formatId];
  if (!isLegalInFormatStatus(status)) {
    return {
      blueprintId: Number(card.id),
      cardName: card.name,
      formatId,
      status,
      message: `${card.name} è ${legalityLabel(status).toLowerCase()} in ${formatId} (${section})`,
    };
  }
  return null;
}

/** Valida legalità mazzo per formato (Scryfall + regole base). */
export function validateDeckLegality(deck: Deck, formatId: FormatId = deck.formatId): {
  legal: boolean;
  issues: DeckLegalityIssue[];
} {
  const issues: DeckLegalityIssue[] = [];
  const minMain = getMainDeckMinSize(formatId);
  const maxSide = getSideboardMaxSize(formatId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);

  if (mainCount < minMain) {
    issues.push({
      blueprintId: 0,
      cardName: '—',
      formatId,
      status: 'not_legal',
      message: `Main deck incompleto: ${mainCount}/${minMain} carte`,
    });
  }

  if (sideCount > maxSide) {
    issues.push({
      blueprintId: 0,
      cardName: '—',
      formatId,
      status: 'not_legal',
      message: `Sideboard eccessivo: ${sideCount}/${maxSide} carte`,
    });
  }

  const allCards = [...deck.main, ...deck.side];
  const oracleCounts = countByOracle(allCards);

  if (formatId === 'commander') {
    for (const [oracle, qty] of oracleCounts) {
      if (qty > 1 && !isBasicLand(oracle)) {
        issues.push({
          blueprintId: 0,
          cardName: oracle,
          formatId,
          status: 'not_legal',
          message: `Commander: max 1 copia per carta (eccetto terre base) — ${oracle}: ${qty}`,
        });
      }
    }
  } else {
    for (const [oracle, qty] of oracleCounts) {
      if (qty > 4 && !isBasicLand(oracle)) {
        issues.push({
          blueprintId: 0,
          cardName: oracle,
          formatId,
          status: 'not_legal',
          message: `Max 4 copie per carta — ${oracle}: ${qty}`,
        });
      }
    }
  }

  if (formatId === 'pauper') {
    for (const card of allCards) {
      const rarity = card.rarity?.toLowerCase();
      if (rarity && rarity !== 'common') {
        issues.push({
          blueprintId: Number(card.id),
          cardName: card.name,
          formatId,
          status: 'not_legal',
          message: `${card.name} non è Common (Pauper)`,
        });
      }
    }
  }

  for (const card of deck.main) {
    const issue = checkCardFormatLegality(card, formatId, 'main');
    if (issue) issues.push(issue);
  }

  for (const card of deck.side) {
    const issue = checkCardFormatLegality(card, formatId, 'side');
    if (issue) issues.push(issue);
  }

  return { legal: issues.length === 0, issues };
}
