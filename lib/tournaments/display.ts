import type { BestOf, TournamentStatus } from '@/types/tournament';

/** Etichetta "Forma" torneo come frazione (mockup: 2/3, 3/5). */
export const TOURNAMENT_FORM_LABEL: Record<BestOf, string> = {
  BO1: '1',
  BO3: '2/3',
  BO5: '3/5',
};

/** Accento visivo per card e righe tabella in base allo stato. */
export const STATUS_ACCENT: Record<
  TournamentStatus,
  { border: string; glow: string; cardOpacity: string }
> = {
  in_registrazione: {
    border: 'border-l-marquee',
    glow: 'shadow-[inset_4px_0_12px_-4px_rgba(var(--marquee-rgb,255,200,0),0.35)]',
    cardOpacity: '',
  },
  iniziata: {
    border: 'border-l-red-400',
    glow: 'shadow-[inset_4px_0_12px_-4px_rgba(248,113,113,0.4)]',
    cardOpacity: '',
  },
  terminata: {
    border: 'border-l-white/25',
    glow: '',
    cardOpacity: 'opacity-80',
  },
};

/** Dettagli mockup stabili per tooltip partecipanti (fino all'API reale). */
export function getMockParticipantDetails(username: string, format: string) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);

  const countries = [
    { code: 'IT', name: 'Italia' },
    { code: 'US', name: 'Stati Uniti' },
    { code: 'DE', name: 'Germania' },
    { code: 'FR', name: 'Francia' },
    { code: 'ES', name: 'Spagna' },
    { code: 'GB', name: 'Regno Unito' },
  ];
  const country = countries[index % countries.length]!;

  const decksPerFormat: Record<string, string[]> = {
    'old-school': ['The Deck', 'Mono Black Control', 'Erhnam Geddon', 'Atog Burn'],
    premodern: ['Elves', 'Goblins', 'Replenish', 'Landstill', 'Trix'],
    pioneer: ['Rakdos Midrange', 'Mono White Humans', 'Lotus Field Combo', 'Azorius Control'],
    modern: ['Izzet Murktide', 'Temur Rhinos', 'Amulet Titan', 'Mono Black Coffers'],
    standard: ['Esper Midrange', 'Red Deck Wins', 'Domain Control', 'Golgari Midrange'],
    legacy: ['Delver of Secrets', 'Reanimator', 'Death and Taxes', 'Initiative Stompy'],
    commander: ["Atraxa, Praetors' Voice", 'Urza, Lord High Artificer', 'Krenko, Mob Boss', 'Kenrith, the Returned King'],
  };

  const decks = decksPerFormat[format] ?? ['Mono Red Burn', 'Blue-White Control', 'Green Stompy'];
  const deck = decks[index % decks.length]!;

  return { country, deck };
}
