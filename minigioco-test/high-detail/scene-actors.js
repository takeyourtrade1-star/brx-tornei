import { cmpDepth } from '../world-client/world-geometry';
import { isRemotePlayerMoving, drawRemotePlayerAnnotations } from '../social-room/piazza-remote-player-presentation';
import { parseAssoWorldLook } from '../../lib/asso-world-look';
import { drawDetailedCharacter, drawDetailedPet } from './character';
import { drawDetailedLayer } from './scene-cache';
import { drawFurnitureMotion } from './furniture-motion';
import { point } from './primitives';

const actor = (kind, x, y, value) => ({ kind, value, minX: x - .01, maxX: x + .01, minY: y - .01, maxY: y + .01 });

export function drawSceneActors(engine, scene, ctx) {
  const { st } = engine;
  const time = engine.fx.reducedMotion ? 0 : st.t;
  const seated = (st.av.seated || st.afk) && !st.av.to;
  const rows = [...engine.entities, actor('avatar', st.av.fx - (seated ? .31 : 0), st.av.fy, st.av)];
  if (st.room === 'tournament') {
    for (const type of ['cat', 'dog']) {
      const pet = st[type];
      if (!pet.perch) rows.push(actor(type, pet.fx, pet.fy, pet));
    }
    if (st.ghost) rows.push(actor('ghost', 9, 3));
    if (st.tut.active) {
      const guide = engine.updateSpettro();
      rows.push(actor('guide', guide.fx, guide.fy, guide));
    }
  }
  if (st.room === 'piazza') {
    for (const remote of engine.remotePlayers.values()) rows.push(actor('remote', remote.fx, remote.fy, remote));
  }
  const drawPet = (type, pet) => {
    const foot = engine.petFootPoint(pet);
    drawDetailedPet(ctx, {
      ...foot, type, time, direction: pet.dir, mode: pet.state,
      walking: Boolean(pet.to), reducedMotion: engine.fx.reducedMotion,
      petted: Number.isFinite(pet.lastPet) && st.t - pet.lastPet >= 0 && st.t - pet.lastPet < 2.4,
    });
  };
  for (const row of rows.sort(cmpDepth)) {
    if (!row.kind) {
      drawDetailedLayer(ctx, scene.furniture.get(row.key));
      drawFurnitureMotion(ctx, st.room, row, time, {
        reducedMotion: engine.fx.reducedMotion, fx: engine.fx,
        active: row.key === 'turn' ? engine.sfx.musicOn() : st.nearObj?.id === row.inter,
      });
      if (st.room === 'tournament') {
        for (const type of ['cat', 'dog']) if (st[type].perch?.key === row.key) drawPet(type, st[type]);
      }
    } else if (row.kind === 'cat' || row.kind === 'dog') drawPet(row.kind, row.value);
    else {
      const value = row.value || { fx: 9, fy: 3, dir: 'sw' };
      const foot = point(value.fx, value.fy);
      const isLocal = row.kind === 'avatar';
      const remoteLook = row.kind === 'remote' ? parseAssoWorldLook({ hair: value.lookKey?.split(':')[1], outfit: value.lookKey?.split(':')[2] }) : null;
      drawDetailedCharacter(ctx, {
        // Il bacino dettagliato è 13 px sopra i piedi: appoggia sul cuscino o sul tappeto.
        x: foot.x, y: foot.y + (isLocal && seated ? st.afk ? 28 : 16 : 22),
        look: remoteLook || engine.currentLook, direction: value.dir || st.av.dir,
        time, reducedMotion: engine.fx.reducedMotion,
        motionTime: Number.isFinite(value.wt) ? value.wt / (row.kind === 'remote' ? 6 : 8.5) : time,
        walking: Boolean(isLocal ? value.to : row.kind === 'remote' ? isRemotePlayerMoving(value) : row.kind === 'guide' && Math.hypot(value.vx || 0, value.vy || 0) > .01),
        seated: isLocal && seated, blink: isLocal && st.t < st.av.blinkUntil,
        ghost: row.kind === 'ghost' || row.kind === 'guide',
      });
      if (row.kind === 'remote') drawRemotePlayerAnnotations(ctx, value, foot.x, foot.y - 33, engine.remoteRenderOptions);
    }
  }
}
