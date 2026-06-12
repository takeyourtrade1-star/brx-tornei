import type { FormatId } from '@/lib/data/catalog';
import type { CatalogCard, DeckCardEntry } from '@/types/deck';

export const BUILDER_STEPS = [
  { id: 'info', label: 'Info base' },
  { id: 'main', label: 'Main deck' },
  { id: 'side', label: 'Sideboard' },
  { id: 'confirm', label: 'Crea mazzo' },
] as const;

export type BuilderStepId = (typeof BUILDER_STEPS)[number]['id'];

export interface CreateDeckFormState {
  name: string;
  format: FormatId;
  main: DeckCardEntry[];
  sideboard: DeckCardEntry[];
}

export type DeckZone = 'main' | 'sideboard';

export interface CreateDeckBuilderProps {
  initialFormat: FormatId;
  catalogCards: CatalogCard[];
}
