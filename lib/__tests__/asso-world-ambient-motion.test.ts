import { describe, expect, it, vi } from 'vitest';
import { drawAmbientMotion, drawFoliageLayers } from '../../minigioco-test/high-detail/ambient-motion';
import { drawFurnitureMotion } from '../../minigioco-test/high-detail/furniture-motion';

describe('dettagli animati e risparmio del diorama', () => {
  it('conserva il verde a movimento ridotto riusando le bitmap senza trasformarle', () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), drawImage: vi.fn(), translate: vi.fn(), rotate: vi.fn(), transform: vi.fn() };
    const cv = { width: 120, height: 90 };
    const item = { cv, x: 20, y: 30, w: 40, h: 30, anchor: { x: 40, y: 55 }, phase: 1, amplitude: 1, tilt: .01 };
    expect(drawFoliageLayers(ctx, [item], 0, true)).toBe(1);
    expect(drawFoliageLayers(ctx, [item], 99, true)).toBe(1);
    expect(ctx.drawImage.mock.calls[0]).toEqual([cv, 20, 30, 40, 30]);
    expect(ctx.drawImage.mock.calls[1]).toEqual(ctx.drawImage.mock.calls[0]);
    expect(ctx.translate).not.toHaveBeenCalled();
    expect(ctx.transform).not.toHaveBeenCalled();
    expect(cv).toEqual({ width: 120, height: 90 });
  });

  it('muove soltanto la composizione delle fronde senza ricostruire le bitmap', () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), drawImage: vi.fn(), translate: vi.fn(), rotate: vi.fn(), transform: vi.fn() };
    const cv = { width: 120, height: 90 };
    const item = { cv, x: 20, y: 30, w: 40, h: 30, anchor: { x: 40, y: 55 } };
    drawFoliageLayers(ctx, [item], 0, false);
    drawFoliageLayers(ctx, [item], 1, false);
    expect(ctx.translate.mock.calls[0]).not.toEqual(ctx.translate.mock.calls[1]);
    expect(ctx.drawImage.mock.calls[0][0]).toBe(cv);
    expect(ctx.drawImage.mock.calls[1][0]).toBe(cv);
    expect(ctx.save).toHaveBeenCalledTimes(2);
    expect(ctx.restore).toHaveBeenCalledTimes(2);
  });

  it.each([{ reducedMotion: true, fx: { cssAnimations: true } }, { reducedMotion: false, fx: { cssAnimations: false } }])(
    'non disegna gli overlay con effetti disabilitati (%j)', (options) => {
      const ctx = {};
      const desk = { key: 'desk', minX: 0, maxX: 0, minY: 3, maxY: 5 };
      expect(drawFurnitureMotion(ctx, 'tournament', desk, 10, options)).toBeNull();
      expect(drawAmbientMotion(ctx, 'piazza', 10, options)).toBeNull();
    },
  );

  it('lascia fermo il giradischi quando la musica è spenta', () => {
    const turn = { key: 'turn', minX: 10, maxX: 10, minY: 1, maxY: 1 };
    expect(drawFurnitureMotion({}, 'tournament', turn, 10, { active: false, fx: { cssAnimations: true } })).toBeNull();
  });
});
