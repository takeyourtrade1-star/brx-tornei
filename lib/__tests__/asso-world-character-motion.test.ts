import { describe, expect, it } from 'vitest';
import { createCharacterMotion, isAutomaticBlink } from '../../minigioco-test/high-detail/character-motion.js';

describe('movimento dell’avatar dettagliato', () => {
  it('mantiene il frame iniziale fermo e usa motionTime per il passo', () => {
    const zero = createCharacterMotion(0, { walking: true, motionTime: 0 });
    const quarter = createCharacterMotion(0, { walking: true, motionTime: Math.PI / (2 * 8.4) });

    expect(zero.phase).toBe(0);
    expect(zero.lift).toBe(0);
    expect(zero.leftLift).toBe(0);
    expect(zero.rightLift).toBe(0);
    expect(quarter.phase).toBeCloseTo(1);
    expect(quarter.leftLift).toBeGreaterThan(0);
    expect(quarter.rightLift).toBe(0);
  });

  it('alterna il piede sollevato e non anima una posa seduta', () => {
    const opposite = createCharacterMotion(0, {
      walking: true,
      motionTime: (3 * Math.PI) / (2 * 8.4),
    });
    const seated = createCharacterMotion(0, {
      walking: true,
      seated: true,
      motionTime: Math.PI / (2 * 8.4),
    });

    expect(opposite.rightLift).toBeGreaterThan(0);
    expect(opposite.leftLift).toBe(0);
    expect(seated.phase).toBe(0);
    expect(seated.armSwing).toBe(0);
  });

  it('blocca respiro, passo e blink automatico con reduced motion', () => {
    const early = createCharacterMotion(1.2, { walking: true, motionTime: 2.4, reducedMotion: true });
    const late = createCharacterMotion(9.2, { walking: true, motionTime: 8.4, reducedMotion: true });

    expect(early).toEqual(late);
    expect(isAutomaticBlink(5.3)).toBe(true);
    expect(isAutomaticBlink(5.3, true)).toBe(false);
  });
});
