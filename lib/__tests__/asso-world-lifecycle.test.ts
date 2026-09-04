import { afterEach, describe, expect, it, vi } from 'vitest';
import { disposeWorld } from '../../minigioco-test/world-engine/dispose-world';
import { installLoop } from '../../minigioco-test/world-engine/loop';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function loopFixture() {
  vi.useFakeTimers();
  vi.stubGlobal('window', { setTimeout, clearTimeout });
  vi.stubGlobal('document', { hidden: false });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  const engine = {
    st: { destroyed: false, paused: false, modal: null as string | null, raf: null, pauseTimer: null, t: 0, keys: new Set<string>() },
    apiRef: { current: {} },
    frameLimiter: { pause: vi.fn(), consume: vi.fn(() => 0.016) },
    scheduleFrame: vi.fn(), update: vi.fn(), render: vi.fn(),
    opts: { onError: vi.fn() },
    sfx: { dispose: vi.fn() },
    api: { destroy: vi.fn() },
    loop: (_timestamp: number) => undefined,
  };
  engine.api.destroy.mockImplementation(() => disposeWorld(engine));
  installLoop(engine);
  return engine;
}

describe('lifecycle del motore Asso World', () => {
  it('sospende rendering e simulazione dietro una superficie o un cabinato', () => {
    for (const modal of [null, 'arcade1', 'kakegurui']) {
      const engine = loopFixture();
      engine.st.paused = modal === null;
      engine.st.modal = modal;
      engine.loop(100);
      expect(engine.update).not.toHaveBeenCalled();
      expect(engine.render).not.toHaveBeenCalled();
      expect(engine.st.t).toBe(0);
      expect(engine.frameLimiter.pause).toHaveBeenCalledWith(100);
      vi.advanceTimersByTime(200);
      expect(engine.scheduleFrame).toHaveBeenCalledTimes(1);
      disposeWorld(engine);
    }
  });

  it('interrompe errori ripetuti, libera le risorse e mostra un errore recuperabile', () => {
    const engine = loopFixture();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    engine.render.mockImplementation(() => { throw new Error('Canvas non disponibile'); });
    engine.loop(100); engine.loop(116); engine.loop(132); engine.loop(148);
    expect(engine.render).toHaveBeenCalledTimes(3);
    expect(engine.st.destroyed).toBe(true);
    expect(engine.api.destroy).toHaveBeenCalledTimes(1);
    expect(engine.sfx.dispose).toHaveBeenCalledTimes(1);
    expect(engine.opts.onError).toHaveBeenCalledTimes(1);
    disposeWorld(engine);
    expect(engine.sfx.dispose).toHaveBeenCalledTimes(1);
  });

  it('ripulisce anche un avvio interrotto prima della creazione dello stato', () => {
    const engine = { ro: { disconnect: vi.fn() }, removeInput: vi.fn(), sfx: { dispose: vi.fn() } };
    disposeWorld(engine); disposeWorld(engine);
    expect(engine.ro.disconnect).toHaveBeenCalledTimes(1);
    expect(engine.removeInput).toHaveBeenCalledTimes(1);
    expect(engine.sfx.dispose).toHaveBeenCalledTimes(1);
  });
});
