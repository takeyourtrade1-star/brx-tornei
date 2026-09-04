import { describe, expect, it, vi } from 'vitest';
import { createWorldInputBindings, shouldHandleGameKey } from '../../minigioco-test/world-engine/input';
import { shouldApplyLocalPosition } from '../../minigioco-test/world-engine/api-bridge';
import { findRoomRoute, planInteractivePath, getInteractionModalId } from '../../minigioco-test/world-engine/navigation';
import { ROOM_FURNITURE, ROOM_INTERACTIVES, ROOM_DEFAULTS } from '../../minigioco-test/world-engine/config';
import { createProjector, fitWorldScale } from '../../minigioco-test/world-engine/math';

const rooms = ['tournament', 'arcade', 'piazza'] as const;

describe('motore Asso World', () => {
  it('raggiunge tutti gli oggetti da ogni ingresso senza attraversare arredi', () => {
    for (const room of rooms) {
      const blocked = new Set<string>();
      ROOM_FURNITURE[room].forEach((item: { tiles: number[][] }) => {
        item.tiles.forEach(([x, y]) => blocked.add(`${x},${y}`));
      });
      for (const id of Object.keys(ROOM_INTERACTIVES[room])) {
        const plan = planInteractivePath({
          room, id, position: ROOM_DEFAULTS[room].entry, blocked,
          interactives: ROOM_INTERACTIVES[room], pathfinder: undefined,
        });
        expect(plan, `${room}/${id}`).not.toBeNull();
        for (const point of plan!.path) expect(blocked.has(`${point.cx},${point.cy}`)).toBe(false);
      }
    }
    expect(findRoomRoute('arcade', 'piazza')).toEqual(['arcade', 'tournament', 'piazza']);
    expect(findRoomRoute('piazza', 'arcade')).toEqual(['piazza', 'tournament', 'arcade']);
    expect(findRoomRoute('unknown', 'piazza')).toBeNull();
  });

  it('collega i cabinati e i tavoli della piazza alle superfici esistenti', () => {
    const expected = { piazzaCab1: 'arcade1', piazzaCab2: 'arcade2', piazzaCab3: 'arcade3', piazzaTable1: 'pc', piazzaTable2: 'board' };
    for (const [id, modal] of Object.entries(expected)) {
      const definition = ROOM_INTERACTIVES.piazza[id as keyof typeof ROOM_INTERACTIVES.piazza];
      expect(getInteractionModalId(id, definition)).toBe(modal);
    }
  });

  it('ignora gli echo del cammino ma applica una posizione corretta estranea alla rotta', () => {
    const avatar = { from: { cx: 2, cy: 2 }, to: { cx: 3, cy: 2 }, queue: [{ cx: 4, cy: 2 }], localEchoes: [{ cx: 1, cy: 2 }] };
    for (const x of [1, 2, 3, 4]) expect(shouldApplyLocalPosition(avatar, { x, y: 2 })).toBe(false);
    expect(shouldApplyLocalPosition(avatar, { x: 8, y: 4 })).toBe(true);
    expect(shouldApplyLocalPosition(avatar, { x: 2.5, y: 2 })).toBe(false);
    expect(avatar.queue).toEqual([{ cx: 4, cy: 2 }]);
  });

  it('non intercetta chat, bottoni, contenuti modificabili o tasti fuori dal gioco', () => {
    const canvas = { tagName: 'CANVAS' };
    const wrap = { contains: (target: unknown) => target === canvas };
    expect(shouldHandleGameKey({ target: canvas }, wrap)).toBe(true);
    expect(shouldHandleGameKey({ target: canvas, defaultPrevented: true }, wrap)).toBe(false);
    for (const target of [{ tagName: 'INPUT' }, { tagName: 'BUTTON' }, { isContentEditable: true }, { tagName: 'A' }]) {
      expect(shouldHandleGameKey({ target }, { contains: () => true })).toBe(false);
    }
    expect(shouldHandleGameKey({ target: {} }, wrap)).toBe(false);
  });

  it('rilascia i tasti anche dopo un cambio focus e rimuove tutti i listener', () => {
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { defaultView: win, hidden: false });
    const canvas = Object.assign(new EventTarget(), { ownerDocument: doc });
    const wrap = Object.assign(new EventTarget(), { contains: (target: unknown) => target === canvas });
    const down = vi.fn(), up = vi.fn(), blur = vi.fn();
    const cleanup = createWorldInputBindings({ canvas, wrap, onPointerDown: vi.fn(), onPointerMove: vi.fn(), onPointerLeave: vi.fn(), onKeyDown: down, onKeyUp: up, onBlur: blur });
    win.dispatchEvent(new Event('keydown'));
    expect(down).not.toHaveBeenCalled();
    win.dispatchEvent(new Event('keyup'));
    expect(up).toHaveBeenCalledTimes(1);
    wrap.dispatchEvent(new Event('focusout'));
    win.dispatchEvent(new Event('blur'));
    expect(blur).toHaveBeenCalledTimes(2);
    cleanup(); cleanup();
    win.dispatchEvent(new Event('keyup')); win.dispatchEvent(new Event('blur'));
    expect(up).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledTimes(2);
  });

  it('mantiene proiezione e selezione coerenti con viewport mobile e zoom', () => {
    for (const [w, h] of [[390, 844], [844, 390], [1280, 720]]) {
      const scale = fitWorldScale(w, h);
      expect(scale * 736).toBeLessThanOrEqual(w);
      expect(scale * 560).toBeLessThanOrEqual(h);
      const projector = createProjector({ w, h, scale }, { x: 368, y: 280, z: 1.35 });
      const screen = projector.project(120, 430);
      const world = projector.unproject(screen.x, screen.y);
      expect(world.x).toBeCloseTo(120);
      expect(world.y).toBeCloseTo(430);
    }
  });
});
