import type { FormatId } from '@/lib/data/catalog';
import type { CardCatalogHit } from './card';

/** Archetipi/strategie di mazzo Magic sensati e ricorrenti. */
export type DeckArchetypeId =
  | 'aggro'
  | 'control'
  | 'combo'
  | 'midrange'
  | 'tempo'
  | 'aggro-combo'
  | 'combo-control'
  | 'ramp'
  | 'prison-stax'
  | 'dredge'
  | 'tribal'
  | 'reanimator'
  | 'storm'
  | 'burn'
  | 'mill'
  | 'toolbox';

export interface DeckArchetype {
  id: DeckArchetypeId;
  name: string;
}

export interface DeckCard extends CardCatalogHit {
  quantity: number;
}

export interface Deck {
  id: string;
  name: string;
  formatId: FormatId;
  archetypeId: DeckArchetypeId;
  main: DeckCard[];
  side: DeckCard[];
  createdAt: string;
}

/** Stato di un mazzo durante la costruzione. */
export interface DeckState {
  name: string;
  formatId: FormatId;
  archetypeId: DeckArchetypeId;
  main: DeckCard[];
  side: DeckCard[];
}
