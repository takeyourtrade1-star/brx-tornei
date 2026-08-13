import type { MatchBadgeId } from '@/lib/validations/match-feedback';

/** Direzione morale del badge: titolo onorifico o segnalazione. */
export type MatchBadgeKind = 'positive' | 'negative';

export interface MatchBadgeDef {
  id: MatchBadgeId;
  label: string;
  description: string;
  kind: MatchBadgeKind;
}

/**
 * Catalogo dei titoli consegnabili all'avversario (stile honor League of
 * Legends). Solo logica pura, condivisibile tra server e client: le icone
 * animate vivono nei componenti (`honor-badge-icons.tsx`), come da
 * separazione UI / data layer.
 */
export const MATCH_BADGES: MatchBadgeDef[] = [
  { id: 'friendly', label: 'Amichevole', description: 'Una presenza gradevole al tavolo.', kind: 'positive' },
  { id: 'kind', label: 'Gentile', description: 'Educato e rispettoso per tutta la partita.', kind: 'positive' },
  { id: 'great_player', label: 'Ottimo giocatore', description: 'Livello di gioco davvero alto.', kind: 'positive' },
  { id: 'sportive', label: 'Spirito sportivo', description: 'Fair play anche nei momenti duri.', kind: 'positive' },
  { id: 'strategist', label: 'Stratega', description: 'Mosso ogni pezzo con un piano.', kind: 'positive' },
  { id: 'creative_genius', label: 'Genio creativo', description: 'Deck e giocate fuori dagli schemi.', kind: 'positive' },
  { id: 'fast_play', label: 'Gioco veloce', description: 'Turni rapidi, zero attese inutili.', kind: 'positive' },
  { id: 'mentor', label: 'Maestro', description: 'Ti ha spiegato regole e giocate con pazienza.', kind: 'positive' },
  { id: 'funny', label: 'Divertente', description: 'Una battaglia leggera e piacevole.', kind: 'positive' },
  { id: 'table_legend', label: 'Leggenda del tavolo', description: 'Un avversario che si ricorda.', kind: 'positive' },
  { id: 'offensive', label: 'Offensivo', description: 'Linguaggio o atteggiamento aggressivo.', kind: 'negative' },
  { id: 'unfair', label: 'Scorretto', description: 'Comportamenti al limite del regolamento.', kind: 'negative' },
  { id: 'laggy', label: 'Laggava', description: 'Connessione instabile per tutta la partita.', kind: 'negative' },
  { id: 'staller', label: 'Perditempo', description: 'Ritmi lentissimi per logorare.', kind: 'negative' },
  { id: 'arrogant', label: 'Arrogante', description: 'Atteggiamento sprezzante e superiore.', kind: 'negative' },
];

export const MATCH_BADGE_BY_ID = new Map(MATCH_BADGES.map((badge) => [badge.id, badge]));
