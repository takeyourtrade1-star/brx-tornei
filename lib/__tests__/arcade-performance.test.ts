import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFrameLimiter } from '../../minigioco-test/frame-limiter';

interface FxFlags {
  dpr: number;
  targetFps: number;
  uiTickMs: number;
}

interface QualityConfig {
  getFxFlags: (quality: 'high' | 'low') => FxFlags;
  resolveQuality: (quality: 'auto' | 'high' | 'low') => 'high' | 'low';
}

const ROOT_PATH = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const qualityConfig = require('../../minigioco-test/quality-config.js') as QualityConfig;

function source(path: string): string {
  return readFileSync(join(ROOT_PATH, path), 'utf8');
}

describe('prestazioni Sala Arcade', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rende la modalita leggera realmente meno costosa', () => {
    const high = qualityConfig.getFxFlags('high');
    const low = qualityConfig.getFxFlags('low');

    expect(high.targetFps).toBe(60);
    expect(low.targetFps).toBe(30);
    expect(low.dpr).toBeLessThan(high.dpr);
    expect(low.dpr).toBeLessThanOrEqual(0.75);
    expect(high.dpr).toBeLessThanOrEqual(1.5);
    expect(high.uiTickMs).toBe(100);
    expect(low.uiTickMs).toBe(250);
  });

  it('sceglie automaticamente la modalita leggera su un telefono', () => {
    vi.stubGlobal('window', {
      innerWidth: 390,
      screen: { width: 390 },
      matchMedia: (query: string) => ({ matches: query === '(pointer: coarse)' }),
    });
    vi.stubGlobal('navigator', {});

    expect(qualityConfig.resolveQuality('auto')).toBe('low');
  });

  it('limita i frame senza accelerare il tempo su display 60/144 Hz', () => {
    for (const [targetFps, displayHz] of [[30, 60], [30, 144], [60, 144]]) {
      const limiter = createFrameLimiter(targetFps);
      const renderedDeltas: number[] = [];

      for (let frame = 0; frame <= displayHz; frame += 1) {
        const dt = limiter.consume(frame * (1000 / displayHz));
        if (dt !== null) renderedDeltas.push(dt);
      }

      expect(renderedDeltas).toHaveLength(targetFps + 1);
      expect(renderedDeltas.reduce((total, dt) => total + dt, 0)).toBeCloseTo(1, 5);
    }
  });

  it('propaga la qualita ai cabinati e limita i loro canvas', () => {
    const room = source('minigioco-test/IsoRoomGame.jsx');
    const modal = source('minigioco-test/arcade-room/ArcadeGameModal.jsx');
    const kit = source('minigioco-test/arcade-room/game-kit.js');
    const stack = source('minigioco-test/arcade-room/StackAttackGame.jsx');
    const jump = source('minigioco-test/arcade-room/TcgJumpGame.jsx');

    expect(room.match(/quality=\{quality\}/g)).toHaveLength(4);
    expect(modal).toContain('quality={quality}');
    expect(kit).toContain('getFxFlags(quality)');
    expect(kit).toContain('createFrameLimiter(perf.targetFps)');
    expect(kit).toContain('dpr = getFxFlags(quality).dpr');
    expect(kit).toContain('document.hidden');
    expect(stack).toContain('{ quality }');
    expect(jump).toContain('{ quality }');
    expect(jump).not.toContain('ctx.setTransform(1, 0, 0, 1, 0, 0)');
  });

  it('carica ogni gioco soltanto quando viene aperto', () => {
    const registry = source('minigioco-test/arcade-room/arcade-registry.js');
    const launcher = source(
      'components/feature/tornei/lobby/arcade-room-launcher.tsx',
    );

    expect(registry.match(/lazy\(\(\) => import\(/g)).toHaveLength(4);
    expect(registry).not.toMatch(/import StackAttackGame from/);
    expect(launcher).toContain("import('./arcade-official-modal')");
    expect(launcher).toContain('{officialSurface ? (');
    expect(launcher).toContain('bg-slate-950 p-2');
  });

  it('ferma la stanza dietro ai giochi e limita i timer React', () => {
    const room = source('minigioco-test/IsoRoomGame.jsx');
    const memory = source('minigioco-test/arcade-room/CardMemoryGame.jsx');
    const duel = source('minigioco-test/arcade-room/KakeguruiGame.jsx');

    expect(room).toContain('ARCADE_GAME_IDS.has(st.modal)');
    expect(room).toContain('createFrameLimiter(fx.targetFps)');
    expect(room).toContain('st.pauseTimer = window.setTimeout');
    expect(room).toContain('}, 200);');
    expect(memory).not.toContain('requestAnimationFrame');
    expect(memory).toContain('window.setInterval(tick, tickMs)');
    expect(duel).not.toContain('requestAnimationFrame');
    expect(duel).toContain('window.setInterval(tick, tickMs)');
    expect(memory).toContain('window.setTimeout(\n      loseLevel');
    expect(memory).toContain('performance.now() >= endRef.current');
    expect(duel).toContain('() => pick(rndMove(), true)');
    expect(duel).toContain('performance.now() >= endRef.current');
    expect(duel).toContain('phase !== "pick" || pPick');
    expect(duel).not.toContain('tick();\n    const timer = window.setInterval');
    expect(source('minigioco-test/arcade-room/ArcadeGameModal.jsx')).toContain(
      'class ArcadeLoadBoundary',
    );
  });
});
