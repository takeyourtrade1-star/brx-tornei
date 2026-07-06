import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { CardCatalogHit } from './card';
import type { DeckLegalityIssue } from './card-legality';
import type { DeckVerificationStatus } from './match-verification';

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
  modeId?: ModeId;
  verificationStatus: DeckVerificationStatus;
  lastVerifiedAt?: string;
  legalityCheckedAt?: string;
  legalityErrors?: DeckLegalityIssue[];
}

/** Stato di un mazzo durante la costruzione. */
export interface DeckState {
  name: string;
  formatId: FormatId;
  archetypeId: DeckArchetypeId;
  main: DeckCard[];
  side: DeckCard[];
}
