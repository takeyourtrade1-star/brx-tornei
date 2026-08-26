import {
  countCards,
  getMainDeckMinSize,
  getSideboardMaxSize,
  hasExactMainDeckSize,
} from '@/lib/data/deck-utils';
import type { Deck, DeckCard } from '@/types/deck';

export interface DeckStructureIssue {
  blueprintId: number;
  cardName: string;
  message: string;
}

export function getCommanderCard(cards: DeckCard[]): DeckCard | undefined {
  return cards.find((card) => card.isCommander === true);
}

/** Regole strutturali necessarie prima di confermare un mazzo. */
export function getDeckStructureIssues(
  deck: Pick<Deck, 'formatId' | 'main' | 'side'>,
): DeckStructureIssue[] {
  const issues: DeckStructureIssue[] = [];
  const target = getMainDeckMinSize(deck.formatId);
  const mainCount = countCards(deck.main);
  const sideCount = countCards(deck.side);

  if (!hasExactMainDeckSize(deck.formatId, mainCount)) {
    issues.push({
      blueprintId: 0,
      cardName: '—',
      message: `${deck.formatId === 'commander' ? 'Commander' : 'Main deck'}: servono esattamente ${target} carte (${mainCount}/${target})`,
    });
  }

  const maxSide = getSideboardMaxSize(deck.formatId);
  if (sideCount > maxSide) {
    issues.push({
      blueprintId: 0,
      cardName: '—',
      message: `Sideboard eccessivo: ${sideCount}/${maxSide} carte`,
    });
  }

  const commanders = deck.main.filter((card) => card.isCommander === true);
  if (deck.formatId === 'commander') {
    if (commanders.length !== 1) {
      issues.push({
        blueprintId: 0,
        cardName: '—',
        message: commanders.length === 0
          ? 'Commander: imposta una carta come comandante'
          : 'Commander: può esserci un solo comandante',
      });
    } else if (commanders[0]!.quantity !== 1) {
      issues.push({
        blueprintId: Number(commanders[0]!.id),
        cardName: commanders[0]!.name,
        message: 'Commander: il comandante deve essere una singola carta',
      });
    }
  } else if (commanders.length > 0) {
    issues.push({
      blueprintId: Number(commanders[0]!.id),
      cardName: commanders[0]!.name,
      message: 'Il comandante è disponibile solo nel formato Commander',
    });
  }

  return issues;
}

export function isDeckStructureComplete(
  deck: Pick<Deck, 'formatId' | 'main' | 'side'>,
): boolean {
  return getDeckStructureIssues(deck).length === 0;
}
