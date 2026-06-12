import type { FormatId } from '@/lib/data/catalog';

/** Stato di validazione del mazzo rispetto al formato scelto. */
export type DeckStatus = 'valido' | 'non_valido' | 'in_revisione';

export interface Deck {
  id: string;
  name: string;
  format: FormatId;
  /** Gioco TCG (MVP: sempre Magic). */
  game: string;
  status: DeckStatus;
  cardCount: number;
  updatedAt: string;
  /** Colori del mazzo (es. ['U', 'R'] per Izzet). */
  colors: string[];
}

/** Carta del catalogo mock (ricerca/aggiunta nel builder). */
export interface CatalogCard {
  id: string;
  name: string;
  typeLine: string;
  manaCost?: string;
  colors: string[];
}

/** Voce nel main o nel sideboard con quantità. */
export interface DeckCardEntry {
  cardId: string;
  name: string;
  quantity: number;
  colors: string[];
}

/** Contenuto completo di un mazzo in fase di creazione. */
export interface DeckContents {
  main: DeckCardEntry[];
  sideboard: DeckCardEntry[];
}
