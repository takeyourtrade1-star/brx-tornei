import { z } from 'zod';

/** Identificatori stabili dei badge di valutazione (contratto col backend). */
export const MATCH_BADGE_IDS = [
  'friendly',
  'kind',
  'great_player',
  'sportive',
  'strategist',
  'creative_genius',
  'fast_play',
  'mentor',
  'funny',
  'table_legend',
  'offensive',
  'unfair',
  'laggy',
  'staller',
  'arrogant',
] as const;

export type MatchBadgeId = (typeof MATCH_BADGE_IDS)[number];

/** Livelli di connessione rilevati dall'utente nel rapporto di fine partita. */
export const MATCH_CONNECTION_LEVELS = ['smooth', 'some_issues', 'poor'] as const;

export type MatchConnectionLevel = (typeof MATCH_CONNECTION_LEVELS)[number];

/** Rapporto di battaglia (fine per abbandono): conferma + qualità connessione. */
export const endFeedbackSchema = z.object({
  disconnectConfirmed: z.boolean(),
  connection: z.enum(MATCH_CONNECTION_LEVELS),
});

export type EndFeedbackInput = z.infer<typeof endFeedbackSchema>;

/** Titolo (badge) assegnato all'avversario a partita conclusa. */
export const opponentBadgeSchema = z.object({
  badge: z.enum(MATCH_BADGE_IDS),
});

export type OpponentBadgeInput = z.infer<typeof opponentBadgeSchema>;
