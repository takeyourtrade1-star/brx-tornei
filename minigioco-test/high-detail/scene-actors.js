import { cmpDepth } from '../world-client/world-geometry';
import { isRemotePlayerMoving, drawRemotePlayerAnnotations } from '../social-room/piazza-remote-player-presentation';
import { parseAssoWorldLook } from '../../lib/asso-world-look';
import { drawDetailedCharacter, drawDetailedPet } from './character';
import { drawDetailedLayer } from './scene-cache';
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
    drawDetailedPet(ctx, { ...foot, type, time, walking: Boolean(pet.to) && !engine.fx.reducedMotion });
  };
  for (const row of rows.sort(cmpDepth)) {
    if (!row.kind) {
      drawDetailedLayer(ctx, scene.furniture.get(row.key));
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
        x: foot.x, y: foot.y + 22 - (isLocal && seated ? st.afk ? 5 : 21 : 0),
        look: remoteLook || engine.currentLook, direction: value.dir || st.av.dir,
        time, walking: !engine.fx.reducedMotion && Boolean(isLocal ? value.to : row.kind === 'remote' && isRemotePlayerMoving(value)),
        seated: isLocal && seated, blink: isLocal && st.t < st.av.blinkUntil,
        ghost: row.kind === 'ghost' || row.kind === 'guide',
      });
      if (row.kind === 'remote') drawRemotePlayerAnnotations(ctx, value, foot.x, foot.y - 33, engine.remoteRenderOptions);
    }
  }
}
