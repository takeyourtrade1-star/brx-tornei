import { FORMATS } from '@/lib/data/catalog';
import type { BuyIn } from '@/lib/data/buy-in';
import type { BestOf, Tournament, TournamentStatus } from '@/types/tournament';

const MOCK_USERNAMES = [
  'marco..199',
  'franco2005',
  'giuseppe_pro',
  'chiara_mtg',
  'luca_vintage',
  'ale_reborn',
  'simone_deck',
  'elena_play',
  'matteo_gg',
  'davide_tcg',
  'faerie_king',
  'common_hero',
  'brx_player',
  'marco_mengoni',
  'deck_wizard',
  'control_mage',
  'aggro_king',
  'combo_lord',
] as const;

const BUY_INS: BuyIn[] = ['for_fun', 'micro', 'low', 'mid', 'high'];
const BEST_OFS: BestOf[] = ['BO1', 'BO3', 'BO5'];
const STATUSES: TournamentStatus[] = ['in_registrazione', 'iniziata', 'terminata'];

/** Aggiunge tornei mock extra per ogni formato (lista scrollabile). */
export function extendMockTournaments(base: Tournament[]): Tournament[] {
  const extras: Tournament[] = [];

  for (const format of FORMATS) {
    for (let i = 0; i < 12; i++) {
      const buyIn = BUY_INS[i % BUY_INS.length]!;
      const bestOf = BEST_OFS[i % BEST_OFS.length]!;
      const status = STATUSES[i % STATUSES.length]!;
      const day = String(20 - (i % 14)).padStart(2, '0');
      const hour = String(8 + (i % 12)).padStart(2, '0');

      let participants: Tournament['participants'] = [];
      if (status === 'iniziata' || status === 'terminata') {
        participants = [
          { id: `u-gen-${format.id}-${i}-a`, username: MOCK_USERNAMES[i % MOCK_USERNAMES.length]! },
          { id: `u-gen-${format.id}-${i}-b`, username: MOCK_USERNAMES[(i + 5) % MOCK_USERNAMES.length]! },
        ];
      } else if (i % 3 === 0) {
        participants = [
          { id: `u-gen-${format.id}-${i}-a`, username: MOCK_USERNAMES[i % MOCK_USERNAMES.length]! },
        ];
      }

      extras.push({
        id: `t-gen-${format.id}-${i + 1}`,
        format: format.id,
        mode: 'heads-up',
        buyIn,
        bestOf,
        status,
        maxPlayers: 2,
        participants,
        createdAt: `2026-06-${day}T${hour}:00:00Z`,
        isPrivate: i % 7 === 0,
      });
    }
  }

  return [...base, ...extras];
}
