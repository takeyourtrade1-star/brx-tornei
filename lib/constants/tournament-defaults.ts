import type { Selection } from '@/lib/validations/selection';

/** Selezione di default dopo login e redirect da /hub: pagina home = "Tutti" i formati. */
export const DEFAULT_TOURNAMENT_SELECTION: Selection = {
  format: 'all',
  mode: 'heads-up',
};

/** Path dashboard tornei con selezione di default. */
export const DEFAULT_TOURNAMENTS_PATH = `/tornei?format=${DEFAULT_TOURNAMENT_SELECTION.format}&mode=${DEFAULT_TOURNAMENT_SELECTION.mode}`;
