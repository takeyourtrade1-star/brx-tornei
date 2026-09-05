import { releaseDetailedScene } from "../high-detail/scene-cache";
/** Cleanup idempotente anche quando l'avvio si interrompe prima di creare l'API. */
export function disposeWorld(engine) {
  if (engine.disposed) return;
  engine.disposed = true;
  if (engine.st) {
    engine.st.destroyed = true;
    engine.st.keys?.clear();
    if (engine.st.raf != null) cancelAnimationFrame(engine.st.raf);
    if (engine.st.pauseTimer != null) window.clearTimeout(engine.st.pauseTimer);
    engine.st.raf = null;
    engine.st.pauseTimer = null;
  }
  releaseDetailedScene(engine);
  engine.detailBackdrop = null;
  engine.ro?.disconnect();
  engine.removeInput?.();
  engine.sfx?.dispose();
}
