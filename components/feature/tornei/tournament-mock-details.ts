import type { BestOf } from '@/types/tournament';

/** "Forma" dal mockup: best-of mostrato come frazione (1, 2/3, 3/5). */
export const BEST_OF_LABEL: Record<BestOf, string> = {
  BO1: '1',
  BO3: '2/3',
  BO5: '3/5',
};

interface Country {
  code: string;
  flag: string;
  name: string;
}

interface MockDetails {
  country: Country;
  deck: string;
}

const COUNTRIES: Country[] = [
  { code: 'IT', flag: '🇮🇹', name: 'Italia' },
  { code: 'US', flag: '🇺🇸', name: 'Stati Uniti' },
  { code: 'DE', flag: '🇩🇪', name: 'Germania' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia' },
  { code: 'ES', flag: '🇪🇸', name: 'Spagna' },
  { code: 'GB', flag: '🇬🇧', name: 'Regno Unito' },
];

const DECKS_PER_FORMAT: Record<string, string[]> = {
  'old-school': ['The Deck', 'Mono Black Control', 'Erhnam Geddon', 'Atog Burn'],
  premodern: ['Elves', 'Goblins', 'Replenish', 'Landstill', 'Trix'],
  pioneer: ['Rakdos Midrange', 'Mono White Humans', 'Lotus Field Combo', 'Azorius Control'],
  modern: ['Izzet Murktide', 'Temur Rhinos', 'Amulet Titan', 'Mono Black Coffers'],
  standard: ['Esper Midrange', 'Red Deck Wins', 'Domain Control', 'Golgari Midrange'],
  legacy: ['Delver of Secrets', 'Reanimator', 'Death and Taxes', 'Initiative Stompy'],
  commander: ["Atraxa, Praetors' Voice", 'Urza, Lord High Artificer', 'Krenko, Mob Boss', 'Kenrith, the Returned King'],
};

/** Dettagli mockup realistici e stabili basati su username e formato del torneo. */
export function getMockParticipantDetails(username: string, format: string): MockDetails {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);

  const decks = DECKS_PER_FORMAT[format] || ['Mono Red Burn', 'Blue-White Control', 'Green Stompy'];

  return {
    country: COUNTRIES[index % COUNTRIES.length]!,
    deck: decks[index % decks.length]!,
  };
}
