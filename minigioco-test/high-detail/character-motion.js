const WALK_SPEED = 8.4;

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Movimento condiviso dall'avatar dettagliato. Il clock di cammino può essere
 * separato dal clock della scena, così un remoto conserva un passo regolare.
 */
export function createCharacterMotion(time = 0, options = {}) {
  const reducedMotion = Boolean(options.reducedMotion);
  const walking = Boolean(options.walking) && !Boolean(options.seated);
  const idleTime = reducedMotion ? 0 : finite(time);
  const walkTime = reducedMotion ? 0 : finite(options.motionTime, idleTime);
  const phase = walking ? Math.sin(walkTime * WALK_SPEED) : 0;

  return {
    phase,
    lift: reducedMotion ? 0 : Math.sin(idleTime * 2.15) * 0.34,
    leftLift: walking ? Math.max(0, phase) * 1.25 : 0,
    rightLift: walking ? Math.max(0, -phase) * 1.25 : 0,
    leftStride: walking ? phase * 1.35 : 0,
    rightStride: walking ? -phase * 1.35 : 0,
    armSwing: walking ? phase * 0.85 : 0,
    gaze: reducedMotion ? 0 : Math.sin(idleTime * 0.68) * 0.32,
    headTurn: reducedMotion ? 0 : Math.sin(idleTime * 0.43) * 0.24,
  };
}

/** Blink breve e prevedibile, attivo anche negli avatar remoti e in preview. */
export function isAutomaticBlink(time = 0, reducedMotion = false) {
  if (reducedMotion || !Number.isFinite(time) || time <= 0) return false;
  const cycle = time % 6.4;
  return (cycle > 5.25 && cycle < 5.4) || (cycle > 5.46 && cycle < 5.57);
}
