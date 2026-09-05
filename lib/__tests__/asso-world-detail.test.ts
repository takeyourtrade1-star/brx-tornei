import { afterEach, describe, expect, it, vi } from 'vitest';
import { hitDetailedObject, releaseDetailedScene } from '../../minigioco-test/high-detail/scene-cache';
import { drawDetailedCharacter } from '../../minigioco-test/high-detail/character';
import { point } from '../../minigioco-test/high-detail/primitives';

afterEach(() => vi.restoreAllMocks());

describe('diorama Asso World', () => {
  it('usa la sagoma disegnata senza cambiare le coordinate dei collider', () => {
    const target = { id: 'pc' };
    const entry = { x: 100, y: 70, w: 3, h: 2, alpha: new Uint8Array([0, 0, 0, 0, 255, 0]) };
    const entity = { key: 'desk', inter: 'pc', minX: 0, minY: 3, maxX: 0, maxY: 5 };
    const engine = { detailScene: { furniture: new Map([['desk', entry]]) }, entities: [entity], inter: { pc: target } };
    expect(hitDetailedObject(engine, { x: 101.2, y: 71.5 })).toBe(target);
    expect(hitDetailedObject(engine, { x: 100.2, y: 70.5 })).toBeNull();
    expect(hitDetailedObject(engine, { x: 600, y: 400 })).toBeNull();
    expect(entity).toEqual({ key: 'desk', inter: 'pc', minX: 0, minY: 3, maxX: 0, maxY: 5 });
  });

  it('libera tutti i canvas anche dopo un avvio incompleto e ripetuti cleanup', () => {
    const cv = { width: 1200, height: 900 };
    const engine = { detailScene: { background: null, furniture: new Map([['desk', { cv }]]) } };
    releaseDetailedScene(engine); releaseDetailedScene(engine);
    expect(cv).toEqual({ width: 1, height: 1 });
    expect(engine.detailScene).toBeNull();
  });

  it('mantiene la proiezione frazionaria dei piedi sul reticolo originale', () => {
    expect(point(5, 6)).toEqual({ x: 304, y: 326 });
    expect(point(5.25, 6, 20)).toEqual({ x: 312, y: 310 });
  });

  it('ignora coordinate non finite senza disegnare né allocare', () => {
    const ctx = { save: vi.fn() };
    drawDetailedCharacter(ctx, { x: NaN, y: 40 });
    drawDetailedCharacter(ctx, { x: 40, y: Infinity });
    expect(ctx.save).not.toHaveBeenCalled();
  });
});
