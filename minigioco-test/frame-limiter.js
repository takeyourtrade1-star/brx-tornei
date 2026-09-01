/* Limita un loop requestAnimationFrame senza accelerare il tempo simulato.
   Le scadenze restano ancorate alla cadenza ideale, così display a 60/144 Hz
   non introducono drift o frame extra per via degli arrotondamenti floating. */

export function createFrameLimiter(targetFps = 60) {
  let frameInterval = intervalFor(targetFps);
  let nextFrameAt = null;
  let lastFrameAt = null;

  return {
    consume(timestamp) {
      if (nextFrameAt === null) nextFrameAt = timestamp;
      if (timestamp + 0.5 < nextFrameAt) return null;

      const dt = lastFrameAt === null
        ? 0
        : Math.min(0.05, Math.max(0, timestamp - lastFrameAt) / 1000);
      const delay = timestamp - nextFrameAt;

      lastFrameAt = timestamp;
      nextFrameAt = delay >= frameInterval
        ? timestamp + frameInterval
        : nextFrameAt + frameInterval;

      return dt;
    },

    pause(timestamp) {
      nextFrameAt = timestamp;
      lastFrameAt = timestamp;
    },

    setTargetFps(nextTargetFps) {
      frameInterval = intervalFor(nextTargetFps);
      nextFrameAt = null;
      lastFrameAt = null;
    },
  };
}

function intervalFor(targetFps) {
  const safeFps = Number.isFinite(targetFps) && targetFps > 0 ? targetFps : 60;
  return 1000 / safeFps;
}
