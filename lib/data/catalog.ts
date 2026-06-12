/**
 * Catalogo statico: formati di gioco e modalità torneo (dal mockup "Pagina Tornei").
 * Step 1 = FORMATO (Old School → Commander), Step 2 = MODALITÀ.
 * Dati di configurazione, non di dominio: vivono qui finché non arriverà un'API dedicata.
 */

export const FORMATS = [
  { id: 'old-school', name: 'Old School' },
  { id: 'premodern', name: 'Pre Modern' },
  { id: 'pioneer', name: 'Pioneer' },
  { id: 'modern', name: 'Modern' },
  { id: 'standard', name: 'Standard' },
  { id: 'legacy', name: 'Legacy' },
  { id: 'commander', name: 'Commander' },
] as const;

export type FormatId = (typeof FORMATS)[number]['id'];

export const MODES = [
  {
    id: 'heads-up',
    name: 'Heads-Up',
    description: '1 contro 1, dalla tua webcam',
    available: true,
    badge: undefined,
  },
  {
    id: 'multiplayer',
    name: 'Multiplayer',
    description: 'Torneo svizzero / eliminazione diretta',
    available: false,
    badge: 'Presto in arrivo',
  },
] as const;

export type ModeId = (typeof MODES)[number]['id'];

export function getFormat(id: string) {
  return FORMATS.find((f) => f.id === id);
}

export function getMode(id: string) {
  return MODES.find((m) => m.id === id);
}

/** Forma del torneo (best-of) — colonna "Forma" nella tabella. */
export const BEST_OF_OPTIONS = [
  { id: 'BO1' as const, label: '1 partita', shortLabel: '1', description: 'Singola partita decisiva' },
  { id: 'BO3' as const, label: '2 su 3', shortLabel: '2/3', description: 'Al meglio di tre partite' },
  { id: 'BO5' as const, label: '3 su 5', shortLabel: '3/5', description: 'Al meglio di cinque partite' },
] as const;

export type BestOfId = (typeof BEST_OF_OPTIONS)[number]['id'];

/** Preset partecipanti per modalità torneo. Heads-Up è fisso a 2. */
export const PARTICIPANT_PRESETS: Record<ModeId, readonly { value: number; label: string }[]> = {
  'heads-up': [{ value: 2, label: '2 giocatori (1 contro 1)' }],
  multiplayer: [
    { value: 4, label: '4 giocatori' },
    { value: 8, label: '8 giocatori' },
    { value: 16, label: '16 giocatori' },
    { value: 32, label: '32 giocatori' },
  ],
};

export function getParticipantPresets(modeId: ModeId) {
  return PARTICIPANT_PRESETS[modeId] ?? PARTICIPANT_PRESETS['heads-up'];
}

export function getDefaultMaxPlayers(modeId: ModeId): number {
  return getParticipantPresets(modeId)[0]!.value;
}

export function isHeadsUpMode(modeId: ModeId): boolean {
  return modeId === 'heads-up';
}
