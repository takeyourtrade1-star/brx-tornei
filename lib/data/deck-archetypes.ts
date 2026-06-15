import type { DeckArchetype } from '@/types/deck';

/** Archetipi Magic ricorrenti, validi in più formati. */
export const DECK_ARCHETYPES: DeckArchetype[] = [
  { id: 'aggro', name: 'Aggro' },
  { id: 'control', name: 'Control' },
  { id: 'combo', name: 'Combo' },
  { id: 'midrange', name: 'Midrange' },
  { id: 'tempo', name: 'Tempo' },
  { id: 'aggro-combo', name: 'Aggro-Combo' },
  { id: 'combo-control', name: 'Combo-Control' },
  { id: 'ramp', name: 'Ramp' },
  { id: 'prison-stax', name: 'Prison / Stax' },
  { id: 'dredge', name: 'Dredge' },
  { id: 'tribal', name: 'Tribal' },
  { id: 'reanimator', name: 'Reanimator' },
  { id: 'storm', name: 'Storm' },
  { id: 'burn', name: 'Burn' },
  { id: 'mill', name: 'Mill' },
  { id: 'toolbox', name: 'Toolbox' },
] as const;

export function getDeckArchetype(id: string): DeckArchetype | undefined {
  return DECK_ARCHETYPES.find((a) => a.id === id);
}
