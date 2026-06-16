'use client';

import type { Tournament } from '@/types/tournament';

/**
 * Simulazione (mock) di una partita di Magic per la vista match/osservatore.
 * Nessun backend: lo stato avanza da solo via {@link advanceMatch} chiamato
 * a intervalli dall'hook. Il modello segue le fasi reali di un turno Magic
 * e tiene un registro delle mosse, i punti vita e il punteggio best-of.
 */

export interface MatchPlayer {
  username: string;
  deck: string;
  flag: string;
  country: string;
  /** Punti vita correnti (parte da 20). */
  life: number;
  /** Carte in mano (mock). */
  hand: number;
  /** Partite vinte nel match best-of. */
  games: number;
}

export type MagicPhase =
  | 'Cambio'
  | 'Mantenimento'
  | 'Acquisizione'
  | 'Principale I'
  | 'Combattimento'
  | 'Principale II'
  | 'Fine';

export interface MatchMove {
  id: number;
  /** Indice del giocatore che ha eseguito la mossa (0 o 1). */
  by: number;
  text: string;
  turn: number;
}

export interface MatchState {
  players: [MatchPlayer, MatchPlayer];
  /** Numero di gara nel best-of (1, 2, 3...). */
  game: number;
  bestOf: number;
  turn: number;
  /** Giocatore di turno (0 o 1). */
  active: number;
  phase: MagicPhase;
  moves: MatchMove[];
  format: string;
}

const PHASES: MagicPhase[] = [
  'Cambio',
  'Mantenimento',
  'Acquisizione',
  'Principale I',
  'Combattimento',
  'Principale II',
  'Fine',
];

const COUNTRIES = [
  { code: 'IT', flag: '🇮🇹', name: 'Italia' },
  { code: 'US', flag: '🇺🇸', name: 'Stati Uniti' },
  { code: 'DE', flag: '🇩🇪', name: 'Germania' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia' },
  { code: 'ES', flag: '🇪🇸', name: 'Spagna' },
  { code: 'GB', flag: '🇬🇧', name: 'Regno Unito' },
];

const DECKS: Record<string, string[]> = {
  'old-school': ['The Deck', 'Mono Black Control', 'Erhnam Geddon', 'Atog Burn'],
  premodern: ['Elves', 'Goblins', 'Replenish', 'Landstill', 'Trix'],
  pioneer: ['Rakdos Midrange', 'Mono White Humans', 'Lotus Field Combo', 'Azorius Control'],
  modern: ['Izzet Murktide', 'Temur Rhinos', 'Amulet Titan', 'Mono Black Coffers'],
  standard: ['Esper Midrange', 'Red Deck Wins', 'Domain Control', 'Golgari Midrange'],
  legacy: ['Delver of Secrets', 'Reanimator', 'Death and Taxes', 'Initiative Stompy'],
  commander: ["Atraxa, Praetors' Voice", 'Urza, Lord High Artificer', 'Krenko, Mob Boss'],
};

const LANDS = ['Isola', 'Montagna', 'Palude', 'Foresta', 'Pianura'];
const CREATURES = [
  'Tarmogoyf', 'Snapcaster Mage', 'Goblin Guide', 'Dark Confidant', 'Delver of Secrets',
  'Monastery Swiftspear', 'Death’s Shadow', 'Ragavan',
];
const SPELLS = [
  'Cancella', 'Forza di Volontà', 'Pensiero Fugace', 'Brainstorm', 'Ponder', 'Riciclaggio',
];

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

function makePlayer(username: string, format: string): MatchPlayer {
  const idx = hashName(username);
  const c = COUNTRIES[idx % COUNTRIES.length]!;
  const decks = DECKS[format] || ['Mono Red Burn', 'Blue-White Control', 'Green Stompy'];
  return {
    username,
    deck: decks[idx % decks.length]!,
    flag: c.flag,
    country: c.name,
    life: 20,
    hand: 7,
    games: 0,
  };
}

const FILLER_OPPONENTS = ['Spectre99', 'ManaBurn', 'TopDeckTom', 'GorillaTactics', 'BlueMage'];

/** Costruisce lo stato iniziale dal torneo (o da nomi mock se mancano). */
export function initMatch(tournament: Tournament, me?: string): MatchState {
  const format = tournament.format;
  const names = tournament.participants.map((p) => p.username);
  // Garantisce due giocatori: se osservo, prendo i primi due; se gioco io, mi metto per primo.
  let a = me && names.includes(me) ? me : names[0];
  let b = names.find((n) => n !== a);
  if (!a) a = me || FILLER_OPPONENTS[0]!;
  if (!b) b = FILLER_OPPONENTS[hashName(a) % FILLER_OPPONENTS.length]!;

  const bestOf = tournament.bestOf === 'BO5' ? 5 : tournament.bestOf === 'BO1' ? 1 : 3;
  return {
    players: [makePlayer(a, format), makePlayer(b, format)],
    game: 1,
    bestOf,
    turn: 1,
    active: 0,
    phase: 'Principale I',
    moves: [
      { id: 1, by: 0, text: `apre la partita con ${makePlayer(a, format).deck}`, turn: 1 },
    ],
    format,
  };
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Genera la prossima mossa per il giocatore di turno e applica gli effetti. */
function nextMove(s: MatchState): { text: string; lifeDelta: [number, number] } {
  const me = s.players[s.active]!;
  const oppIdx = s.active === 0 ? 1 : 0;
  const opp = s.players[oppIdx]!;
  const roll = Math.random();
  const lifeDelta: [number, number] = [0, 0];

  if (s.phase === 'Combattimento') {
    const dmg = 1 + Math.floor(Math.random() * 5);
    lifeDelta[oppIdx] = -dmg;
    return { text: `attacca con ${pick(CREATURES)} → ${opp.username} -${dmg}`, lifeDelta };
  }
  if (roll < 0.28) return { text: `gioca ${pick(LANDS)}`, lifeDelta };
  if (roll < 0.5) return { text: `evoca ${pick(CREATURES)}`, lifeDelta };
  if (roll < 0.68) return { text: `lancia ${pick(SPELLS)}`, lifeDelta };
  if (roll < 0.8) {
    const dmg = 2 + Math.floor(Math.random() * 3);
    lifeDelta[oppIdx] = -dmg;
    return { text: `lancia Fulmine su ${opp.username} (-${dmg})`, lifeDelta };
  }
  if (roll < 0.9) {
    me.hand = Math.min(7, me.hand + 1);
    return { text: 'pesca una carta', lifeDelta };
  }
  return { text: 'passa la priorità', lifeDelta };
}

/** Avanza la simulazione di un passo. Restituisce un NUOVO oggetto stato. */
export function advanceMatch(prev: MatchState): MatchState {
  const s: MatchState = {
    ...prev,
    players: [{ ...prev.players[0] }, { ...prev.players[1] }],
    moves: prev.moves,
  };

  const { text, lifeDelta } = nextMove(s);
  s.players[0].life = Math.max(0, s.players[0].life + lifeDelta[0]);
  s.players[1].life = Math.max(0, s.players[1].life + lifeDelta[1]);

  const move: MatchMove = {
    id: (prev.moves[0]?.id ?? 0) + 1,
    by: s.active,
    text,
    turn: s.turn,
  };
  // log in testa, max 40 righe
  s.moves = [move, ...prev.moves].slice(0, 40);

  // avanza fase / turno / giocatore
  const pIdx = PHASES.indexOf(s.phase);
  if (pIdx >= PHASES.length - 1) {
    s.phase = 'Cambio';
    s.active = s.active === 0 ? 1 : 0;
    if (s.active === 0) s.turn += 1;
  } else {
    s.phase = PHASES[pIdx + 1]!;
  }

  // fine gara: un giocatore a 0 vita → nuova gara nel best-of
  const dead = s.players.findIndex((p) => p.life <= 0);
  if (dead !== -1) {
    const winner = dead === 0 ? 1 : 0;
    s.players[winner].games += 1;
    const needed = Math.ceil(s.bestOf / 2);
    if (s.players[winner].games < needed) {
      // reset per la gara successiva
      s.game += 1;
      s.turn = 1;
      s.active = 0;
      s.phase = 'Principale I';
      s.players[0].life = 20;
      s.players[1].life = 20;
      s.players[0].hand = 7;
      s.players[1].hand = 7;
      s.moves = [
        { id: move.id + 1, by: winner, text: `vince la gara ${s.game - 1}! Si parte con la ${s.game}`, turn: 1 },
        ...s.moves,
      ].slice(0, 40);
    }
  }

  return s;
}

/** Indicatore "chi sta vincendo": -100..100 (positivo = giocatore 0 avanti). */
export function advantage(s: MatchState): number {
  const lifeGap = s.players[0].life - s.players[1].life;
  const gameGap = (s.players[0].games - s.players[1].games) * 8;
  return Math.max(-100, Math.min(100, lifeGap * 4 + gameGap));
}

/** Etichetta best-of: "Gara 2 · BO3". */
export function gameLabel(s: MatchState): string {
  return `Gara ${s.game} · BO${s.bestOf}`;
}
