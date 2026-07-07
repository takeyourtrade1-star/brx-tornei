import type { FormatId } from '@/lib/data/catalog';
import { countCards, getMainDeckMinSize, getSideboardMaxSize } from '@/lib/data/deck-utils';
import { isLegalInFormatStatus, legalityLabel } from '@/lib/card-legality-label';
import { getMaxCopiesForCard, getOracleKey } from '@/lib/deck-copy-limits';
import type { DeckLegalityIssue } from '@/types/card-legality';
import type { Deck, DeckCard } from '@/types/deck';

interface OracleGroup {
  /** Nome leggibile della carta (prima stampa incontrata). */
  name: string;
  blueprintId: number;
  quantity: number;
  /** Limite copie più severo tra le stampe del gruppo. */
  maxCopies: number;
  restricted: boolean;
}

/** Raggruppa main+side per oracle: stampe diverse della stessa carta contano insieme. */
function groupByOracle(cards: DeckCard[], formatId: FormatId): Map<string, OracleGroup> {
  const map = new Map<string, OracleGroup>();
  for (const card of cards) {
    const key = getOracleKey(card);
    const maxCopies = getMaxCopiesForCard(formatId, card);
    const restricted = card.tournamentLegalities?.[formatId] === 'restricted';
    const group = map.get(key);
    if (group) {
      group.quantity += card.quantity;
      group.maxCopies = Math.min(group.maxCopies, maxCopies);
      group.restricted = group.restricted || restricted;
    } else {
      map.set(key, {
        name: card.name,
        blueprintId: Number(card.id),
        quantity: card.quantity,
        maxCopies,
        restricted,
      });
    }
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
      message: `${card.name}: legalità non verificata (Asso Vision)`,
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

  // Limiti copie per oracle (main + side insieme): 4 standard, 1 in Commander,
  // 1 per le ristrette, limiti stampati (Seven Dwarves…), nessuno per terre base
  // e carte "any number".
  const allCards = [...deck.main, ...deck.side];
  for (const group of groupByOracle(allCards, formatId).values()) {
    if (group.quantity <= group.maxCopies) continue;
    const message = group.restricted
      ? `${group.name} è ristretta in ${formatId}: massimo 1 copia (nel mazzo: ${group.quantity})`
      : formatId === 'commander' && group.maxCopies === 1
        ? `Commander: max 1 copia per carta (eccetto terre base) — ${group.name}: ${group.quantity}`
        : `Max ${group.maxCopies} copie per carta — ${group.name}: ${group.quantity}`;
    issues.push({
      blueprintId: group.blueprintId,
      cardName: group.name,
      formatId,
      status: group.restricted ? 'restricted' : 'not_legal',
      message,
    });
  }

  // Legalità per carta (bannate, non legali nel formato, legalità mancante).
  // Nota Pauper: lo status Scryfall è autoritativo (una carta è legale se è mai
  // stata stampata comune), quindi niente check sulla rarità della singola stampa.
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
