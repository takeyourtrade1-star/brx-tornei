import { getDetailedScene, drawDetailedLayer } from './scene-cache';
import { drawSceneActors } from './scene-actors';
import { point, polygon, ellipse, roundRect, glow } from './primitives';

function drawGroundFeedback(engine, ctx) {
  const { st, fx } = engine;
  if (st.modal || st.lock || st.photoHide) return;
  const destination = st.av.queue[st.av.queue.length - 1] || st.av.to;
  if (destination) {
    const p = point(destination.cx, destination.cy);
    ellipse(ctx, p.x, p.y + 16, 8, 4, 'rgba(255,225,169,.28)');
    ellipse(ctx, p.x, p.y + 16, 2, 1, '#fff3d6');
  }
  const tile = st.hover.tile;
  if (tile && !engine.blocked.has(`${tile.cx},${tile.cy}`)) {
    polygon(ctx, [point(tile.cx, tile.cy), point(tile.cx + 1, tile.cy), point(tile.cx + 1, tile.cy + 1), point(tile.cx, tile.cy + 1)], 'rgba(255,255,255,.11)', 'rgba(255,243,220,.48)', .65);
  }
  if (!fx.reducedMotion) for (const ripple of st.ripples) {
    const progress = Math.min(1, (st.t - ripple.t0) / .45);
    const p = point(ripple.cx, ripple.cy);
    ctx.globalAlpha = (1 - progress) * .4;
    ellipse(ctx, p.x, p.y + 16, 4 + progress * 19, 2 + progress * 9, '#fff0cf');
  }
  ctx.globalAlpha = 1;
}

function drawAtmosphere(engine, ctx) {
  const { st, fx } = engine;
  const time = fx.reducedMotion ? 0 : st.t;
  if (st.room === 'tournament') {
    glow(ctx, 218, 218, 55, 30, 'rgba(164,230,222,.08)');
    glow(ctx, 690, 307, 38, 25, 'rgba(255,210,132,.14)');
  }
  if (fx.motes) for (let i = 0; i < 12; i++) {
    const x = 82 + (i * 43 % 515) + Math.sin(time * .24 + i) * 6;
    const y = 220 + (i * 29 % 130) - (time * 2 + i * 17) % 42;
    ctx.globalAlpha = .1 + Math.sin(time * .6 + i) ** 2 * .22;
    ellipse(ctx, x, y, .7, .7, '#fff4d0');
  }
  ctx.globalAlpha = 1;
  for (const p of st.fx) {
    const age = st.t - p.t0;
    if (age < 0) continue;
    ctx.globalAlpha = Math.max(0, 1 - age / p.dur);
    ctx.fillStyle = p.col;
    ctx.font = `600 ${p.size}px system-ui`;
    ctx.fillText(p.ch, p.x, p.y - age / p.dur * p.rise);
  }
  ctx.globalAlpha = 1;
  if (st.shadow) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = 'rgba(68,20,104,.2)';
    ctx.fillRect(0, 0, 736, 560);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawRoomHints(engine, frame) {
  if (engine.st.photoHide || engine.st.modal || engine.st.lock) return;
  const ctx = engine.ctx;
  const near = engine.st.nearObj;
  const ids = frame.isTour ? ['pc', 'decks', 'board'] : [];
  ctx.save();
  ctx.font = '600 10px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const id of ids) {
    if (near?.id === id) continue;
    const obj = engine.inter[id];
    const rect = obj.hitRect;
    const at = engine.project(rect.x + rect.w / 2, rect.y + (id === 'decks' ? rect.h : 0));
    const title = id === 'pc' ? 'TORNEI' : id === 'decks' ? 'MAZZI' : 'CREA';
    const width = ctx.measureText(title).width + 23;
    roundRect(ctx, at.x - width / 2, at.y - 10, width, 20, 10, 'rgba(15,30,37,.8)', 'rgba(247,225,180,.2)');
    ellipse(ctx, at.x - width / 2 + 8, at.y, 1.8, 1.8, '#f2ce92');
    ctx.fillStyle = '#f7eedc';
    ctx.fillText(title, at.x + 4, at.y);
  }
  if (near) {
    const r = near.hitRect;
    const at = engine.project(r.x + r.w / 2, r.y);
    const title = near.name;
    ctx.font = '600 12px system-ui';
    const width = Math.min(frame.w - 24, ctx.measureText(title).width + 30);
    const x = Math.max(12, Math.min(frame.w - width - 12, at.x - width / 2));
    const y = Math.max(140, at.y - 38);
    roundRect(ctx, x, y, width, 30, 15, '#f5eada');
    ctx.fillStyle = '#223c40';
    ctx.fillText(title, x + width / 2, y + 15);
  }
  ctx.restore();
}

/** Percorso alta qualità: composizione diretta alla risoluzione del display. */
export function renderDetailedWorld(engine, frame) {
  Object.assign(frame, engine.st.view, { isTour: engine.st.room === 'tournament' });
  const scene = getDetailedScene(engine);
  const { ctx, st, canvas } = engine;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const backgroundKey = `${canvas.width}:${canvas.height}:${st.room}`;
  if (engine.detailBackdrop?.key !== backgroundKey) {
    const fill = ctx.createRadialGradient(canvas.width * .5, canvas.height * .42, 0, canvas.width * .5, canvas.height * .45, canvas.width * .7);
    fill.addColorStop(0, st.room === 'piazza' ? '#26454b' : '#243944');
    fill.addColorStop(1, '#101b2b');
    engine.detailBackdrop = { key: backgroundKey, fill };
  }
  ctx.fillStyle = engine.detailBackdrop.fill;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const scale = frame.scale * st.cam.z * frame.dpr;
  ctx.setTransform(scale, 0, 0, scale, canvas.width / 2 - st.cam.x * scale, canvas.height / 2 - st.cam.y * scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  drawDetailedLayer(ctx, scene.background);
  drawGroundFeedback(engine, ctx);
  drawSceneActors(engine, scene, ctx);
  drawAtmosphere(engine, ctx);
  ctx.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
  if (st.transition) {
    const progress = st.transition.t / .8;
    ctx.fillStyle = `rgba(16,27,43,${Math.max(0, 1 - Math.abs(progress * 2 - 1))})`;
    ctx.fillRect(0, 0, frame.w, frame.h);
  }
  drawRoomHints(engine, frame);
}
