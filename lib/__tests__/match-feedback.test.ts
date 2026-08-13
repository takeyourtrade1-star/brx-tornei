import { describe, expect, it } from 'vitest';
import {
  endFeedbackSchema,
  opponentBadgeSchema,
  MATCH_BADGE_IDS,
} from '@/lib/validations/match-feedback';
import { MATCH_BADGES, MATCH_BADGE_BY_ID } from '@/lib/data/match-badge-catalog';

describe('match-feedback validations', () => {
  it('accetta un rapporto di battaglia valido', () => {
    const result = endFeedbackSchema.safeParse({
      disconnectConfirmed: true,
      connection: 'some_issues',
    });
    expect(result.success).toBe(true);
  });

  it('rifiuta livelli di connessione sconosciuti', () => {
    const result = endFeedbackSchema.safeParse({
      disconnectConfirmed: true,
      connection: 'ultra_fast',
    });
    expect(result.success).toBe(false);
  });

  it('rifiuta un rapporto senza conferma dell esito', () => {
    const result = endFeedbackSchema.safeParse({ connection: 'smooth' });
    expect(result.success).toBe(false);
  });

  it('accetta un badge del catalogo', () => {
    const result = opponentBadgeSchema.safeParse({ badge: 'friendly' });
    expect(result.success).toBe(true);
  });

  it('rifiuta badge fuori catalogo', () => {
    const result = opponentBadgeSchema.safeParse({ badge: 'magnifico' });
    expect(result.success).toBe(false);
  });
});

describe('match-feedback catalog', () => {
  it('tutti gli id sono unici', () => {
    const ids = MATCH_BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('copre esattamente i 15 id del contratto', () => {
    expect(MATCH_BADGES).toHaveLength(15);
    expect(MATCH_BADGE_IDS).toHaveLength(15);
    for (const id of MATCH_BADGE_IDS) {
      expect(MATCH_BADGE_BY_ID.has(id)).toBe(true);
    }
  });

  it('ogni badge ha label, descrizione e kind validi', () => {
    for (const badge of MATCH_BADGES) {
      expect(badge.label.length).toBeGreaterThan(0);
      expect(badge.description.length).toBeGreaterThan(0);
      expect(['positive', 'negative']).toContain(badge.kind);
    }
  });

  it('dieci titoli positivi e cinque segnalazioni', () => {
    const positive = MATCH_BADGES.filter((b) => b.kind === 'positive');
    const negative = MATCH_BADGES.filter((b) => b.kind === 'negative');
    expect(positive).toHaveLength(10);
    expect(negative).toHaveLength(5);
  });
});
