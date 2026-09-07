import { describe, expect, it } from 'vitest';
import { createPetPose } from '../../minigioco-test/high-detail/pet-common';

describe('movimento pet del diorama', () => {
  it('dà precedenza al cammino anche quando lo stato resta sit o sleep', () => {
    for (const type of ['cat', 'dog']) {
      const moving = createPetPose({ type, mode: 'sleep', walking: true, time: 1 });
      expect(moving.moving).toBe(true);
      expect(moving.resting).toBe(false);
      expect(moving.seated).toBe(false);
      expect(moving.sleeping).toBe(false);

      const frozen = createPetPose({ type, mode: 'sleep', walking: true, time: 1, reducedMotion: true });
      expect(frozen.moving).toBe(false);
      expect(frozen.resting).toBe(false);
      expect(frozen.seated).toBe(false);
      expect(frozen.gait).toBe(0);
    }
  });

  it('mantiene gli occhi aperti al frame iniziale e consente il blink dopo tre secondi', () => {
    expect(createPetPose({ type: 'cat', time: 0 }).blink).toBe(0);
    expect(createPetPose({ type: 'cat', time: 3.3 }).blink).toBeGreaterThan(0);
    expect(createPetPose({ type: 'cat', time: 0, reducedMotion: true }).blink).toBe(0);
    expect(createPetPose({ type: 'cat', mode: 'sleep', time: 0 }).blink).toBe(1);
  });
});
