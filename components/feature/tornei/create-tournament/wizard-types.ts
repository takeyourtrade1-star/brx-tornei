import type { FormatId, ModeId, BestOfId } from '@/lib/data/catalog';

export type TournamentVisibility = 'public' | 'private';

export interface CreateTournamentFormState {
  buyIn: 'for_fun';
  format: FormatId;
  mode: ModeId;
  bestOf: BestOfId;
  maxPlayers: number;
  visibility: TournamentVisibility;
}

export const WIZARD_STEPS = [
  { id: 'buy-in', label: 'Buy-in' },
  { id: 'format', label: 'Formato' },
  { id: 'details', label: 'Dettagli' },
  { id: 'confirm', label: 'Conferma' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];
