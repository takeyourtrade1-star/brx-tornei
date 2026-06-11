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
