import { describe, expect, it } from 'vitest';
import {
  ASSO_WORLD_STORY_SEGMENTS,
  getStoryWordTokens,
} from '@/lib/data/asso-world-story';
import { assoBetaRequestSchema } from '@/lib/validations/asso-beta';
import { isBetaUserRegistered, registerBetaUser } from '@/lib/data/asso-beta-store';

describe('Asso World Story Data', () => {
  it('contiene i segmenti narrativi della visione Ebartex', () => {
    expect(ASSO_WORLD_STORY_SEGMENTS.length).toBeGreaterThan(3);
    const fullText = ASSO_WORLD_STORY_SEGMENTS.map((s) => s.text).join(' ');
    expect(fullText).toContain('Asso World');
    expect(fullText).toContain('Ebartex');
    expect(fullText).toContain('Digitale 2.0');
    expect(fullText).toContain("C'era una volta");
  });

  it('scompone la storia in token parola per parola con indici progressivi', () => {
    const tokens = getStoryWordTokens();
    expect(tokens.length).toBeGreaterThan(100);
    expect(tokens[0]?.word).toBe("C'era");
    expect(tokens[0]?.index).toBe(0);
    expect(tokens[tokens.length - 1]?.index).toBe(tokens.length - 1);
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
    const testUserId = 'usr_test_beta_123';
    expect(isBetaUserRegistered(testUserId)).toBe(false);
    registerBetaUser(testUserId);
    expect(isBetaUserRegistered(testUserId)).toBe(true);
  });
});
