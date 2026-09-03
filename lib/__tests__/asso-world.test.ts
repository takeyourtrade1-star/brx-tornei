import { describe, expect, it } from 'vitest';
import {
  ASSO_WORLD_STORY_SENTENCES,
  ASSO_WORLD_STORY_SEGMENTS,
  getStoryWordTokens,
} from '@/lib/data/asso-world-story';
import { assoBetaRequestSchema } from '@/lib/validations/asso-beta';
import { isBetaUserRegistered, registerBetaUser } from '@/lib/data/asso-beta-store';

describe('Asso World Story Data', () => {
  it('contiene le frasi della fiaba di Asso World', () => {
    expect(ASSO_WORLD_STORY_SENTENCES.length).toBeGreaterThan(5);
    const fullText = ASSO_WORLD_STORY_SENTENCES.map((s) => s.text).join(' ');
    expect(fullText).toContain('Asso World');
    expect(fullText).toContain('Ebartex');
    expect(fullText).toContain('Digitale 2.0');
    expect(fullText).toContain("C'era una volta");
  });

  it('ogni frase ha un identificatore e durata di lettura definita', () => {
    for (const sentence of ASSO_WORLD_STORY_SENTENCES) {
      expect(sentence.id).toBeTruthy();
      expect(sentence.text.length).toBeGreaterThan(10);
      expect(sentence.durationMs).toBeGreaterThan(3000);
    }
  });

  it('mantiene la compatibilità retroattiva per segmenti e token', () => {
    expect(ASSO_WORLD_STORY_SEGMENTS.length).toBe(ASSO_WORLD_STORY_SENTENCES.length);
    const tokens = getStoryWordTokens();
    expect(tokens.length).toBeGreaterThan(80);
  });
});

describe('Asso World Beta Validation & Store', () => {
  it('valida payload vuoto o con note opzionali', () => {
    const validEmpty = assoBetaRequestSchema.safeParse({});
    expect(validEmpty.success).toBe(true);

    const validNotes = assoBetaRequestSchema.safeParse({
      notes: 'Vorrei testare il formato Modern su Mac',
    });
    expect(validNotes.success).toBe(true);

    const invalidLong = assoBetaRequestSchema.safeParse({
      notes: 'a'.repeat(501),
    });
    expect(invalidLong.success).toBe(false);
  });

  it('registra lo stato di adesione alla beta per un utente', () => {
    const testUserId = 'usr_test_beta_456';
    expect(isBetaUserRegistered(testUserId)).toBe(false);
    registerBetaUser(testUserId);
    expect(isBetaUserRegistered(testUserId)).toBe(true);
  });
});
