/* Decorazioni della parete: forme semplici e coordinate fisse per gli hit-test
 * del gioco. Lo specchio e il citofono hanno rettangoli volutamente invariati. */

import { HTH, HTW, WALL_H, P, RAR } from "./room-config.js";
import { quadFill, shade, wallL, wallR } from "./room-primitives.js";

function posterPanel(ctx, wp, c0, c1, hTop, hBot, color) {
  quadFill(ctx, [wp(c0 + 0.07, hBot - 3), wp(c1 + 0.07, hBot - 3), wp(c1 + 0.07, hTop - 3), wp(c0 + 0.07, hTop - 3)], "rgba(40,32,60,0.22)");
  quadFill(ctx, [wp(c0, hBot), wp(c1, hBot), wp(c1, hTop), wp(c0, hTop)], color);
}

function posterBand(ctx, wp, c0, c1, h1, h2, color) {
  quadFill(ctx, [wp(c0, h1), wp(c1, h1), wp(c1, h2), wp(c0, h2)], color);
}

export function drawWindow(ctx, phase) {
  const center = wallL(6.7, 60);
  const beam = Number.isFinite(phase.beam) ? phase.beam : 0.2;
  const glow = ctx.createRadialGradient(center.x, center.y, 4, center.x, center.y, 70);
  glow.addColorStop(0, `rgba(255,250,220,${(0.22 * beam / 0.2).toFixed(3)})`);
  glow.addColorStop(1, "rgba(255,250,220,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(wallL(8.6, 110).x, wallL(8.6, 110).y, 180, 140);

  /* Cornice e apertura: questi quattro lati sono anche l'anchor del window egg. */
  quadFill(ctx, [wallL(5.7, 92), wallL(7.7, 92), wallL(7.7, 28), wallL(5.7, 28)], P.woodD);
  const skyTop = wallL(6.7, 88).y, skyBot = wallL(6.7, 34).y;
  const sky = ctx.createLinearGradient(0, skyTop, 0, skyBot);
  sky.addColorStop(0, phase.skyTop); sky.addColorStop(1, phase.skyBot);
  quadFill(ctx, [wallL(5.82, 86), wallL(7.58, 86), wallL(7.58, 34), wallL(5.82, 34)], sky);

  if (phase.celestial === "moon") {
    const moon = wallL(6.15, 74);
    ctx.fillStyle = "#f3f0dc"; ctx.fillRect(moon.x, moon.y, 7, 7);
    ctx.fillStyle = phase.skyTop; ctx.fillRect(moon.x + 4, moon.y - 1, 5, 5);
    if (phase.stars) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const [c, h] of [[6.0, 80], [6.6, 70], [7.1, 78], [7.35, 56], [6.3, 50], [7.45, 68]]) {
        const s = wallL(c, h); ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      }
    }
  } else {
    const sun = wallL(6.1, phase.id === "day" ? 74 : 52);
    ctx.fillStyle = phase.id === "day" ? "#fff3b8" : "#ffc46e"; ctx.fillRect(sun.x, sun.y, 7, 7);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const cloud = wallL(7.0, 58); ctx.fillRect(cloud.x, cloud.y, 14, 4);
    const cloud2 = wallL(6.85, 62); ctx.fillRect(cloud2.x, cloud2.y, 8, 4);
  }
  quadFill(ctx, [wallL(6.66, 88), wallL(6.84, 88), wallL(6.84, 32), wallL(6.66, 32)], P.wood);
  quadFill(ctx, [wallL(5.8, 62), wallL(7.6, 62), wallL(7.6, 58), wallL(5.8, 58)], P.wood);
  quadFill(ctx, [wallL(5.66, 28), wallL(7.74, 28), wallL(7.74, 24), wallL(5.66, 24)], P.woodL);
  quadFill(ctx, [wallL(5.78, 29), wallL(7.62, 29), wallL(7.62, 27.5), wallL(5.78, 27.5)], "rgba(255,255,255,0.2)");
}

export function drawBrandPoster(ctx) {
  posterPanel(ctx, wallL, 1.0, 2.7, 96, 48, "#1d3160");
  quadFill(ctx, [wallL(1.0, 96), wallL(2.7, 96), wallL(2.7, 48), wallL(1.0, 48)], false, P.gold, 1.5);
  const c = wallL(1.85, 72);
  ctx.fillStyle = "#121e3d"; ctx.beginPath(); ctx.ellipse(c.x, c.y - 2, 21, 12, -0.32, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(c.x, c.y - 2); ctx.rotate(-0.32);
  ctx.strokeStyle = "#ff7300"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 2, 14, 0.1, Math.PI - 0.4); ctx.stroke();
  ctx.fillStyle = "#ff7300"; ctx.beginPath(); ctx.moveTo(13, -1); ctx.lineTo(17, 3); ctx.lineTo(12, 5); ctx.fill();
  ctx.scale(1, 0.82); ctx.fillStyle = P.white; ctx.font = "bold 8.5px 'Inter', 'Outfit', 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("ebartex", 0, -4); ctx.restore();
}

export function drawMirror(ctx) {
  /* Rettangolo preservato: [wallL(8.05,98), wallL(9.85,98),
   * wallL(9.85,30), wallL(8.05,30)]. Nessuna decorazione lo riusa. */
  quadFill(ctx, [wallL(8.05, 98), wallL(9.85, 98), wallL(9.85, 30), wallL(8.05, 30)], P.woodD);
  quadFill(ctx, [wallL(8.18, 95), wallL(9.72, 95), wallL(9.72, 33), wallL(8.18, 33)], P.woodL);
  quadFill(ctx, [wallL(8.28, 93), wallL(9.62, 93), wallL(9.62, 35), wallL(8.28, 35)], P.woodD);
  const gt = wallL(8.95, 92), gb = wallL(8.95, 36);
  const glass = ctx.createLinearGradient(gt.x, gt.y, gb.x, gb.y);
  glass.addColorStop(0, "#dceaf4"); glass.addColorStop(0.45, P.glass); glass.addColorStop(1, "#83a9c6");
  quadFill(ctx, [wallL(8.32, 91), wallL(9.58, 91), wallL(9.58, 37), wallL(8.32, 37)], glass);
  quadFill(ctx, [wallL(8.55, 89), wallL(8.95, 89), wallL(8.78, 39), wallL(8.38, 39)], "rgba(255,255,255,0.26)");
  quadFill(ctx, [wallL(9.22, 86), wallL(9.42, 86), wallL(9.32, 41), wallL(9.12, 41)], "rgba(255,255,255,0.15)");
  quadFill(ctx, [wallL(8.32, 49), wallL(9.58, 49), wallL(9.58, 37), wallL(8.32, 37)], "rgba(214,205,175,0.16)");
  const spark = wallL(8.62, 84);
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(Math.round(spark.x) - 1, Math.round(spark.y), 3, 1); ctx.fillRect(Math.round(spark.x), Math.round(spark.y) - 1, 1, 3);
}

function drawMiniCard(ctx, pos, rarity, banned) {
  const rc = (RAR[rarity] || RAR.comune).c;
  ctx.save(); ctx.translate(pos.x, pos.y); ctx.rotate(Math.atan2(HTH, HTW));
  ctx.fillStyle = P.night; ctx.fillRect(-8, -12, 16, 24);
  ctx.fillStyle = P.paper; ctx.fillRect(-7, -11, 14, 22);
  ctx.fillStyle = rc; ctx.fillRect(-5, -9, 10, 9);
  ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.fillRect(-3, -7, 3, 3);
  ctx.fillStyle = P.ink; ctx.fillRect(-5, 3, 10, 1.5); ctx.fillRect(-5, 6, 7, 1.5);
  if (banned) {
    ctx.fillStyle = P.red;
    for (let i = -2; i <= 2; i += 1) { ctx.fillRect(i * 4 - 2, i * 4 - 2, 4, 4); ctx.fillRect(-i * 4 - 2, i * 4 - 2, 4, 4); }
  }
  ctx.restore();
}

export function drawDynamicPosters(ctx, posters) {
  if (!posters) return;
  const week = posters.week, ban = posters.ban;
  if (week) {
    posterPanel(ctx, wallR, 0.55, 1.6, 92, 42, "#1d2a4d");
    quadFill(ctx, [wallR(0.63, 89), wallR(1.52, 89), wallR(1.52, 45), wallR(0.63, 45)], false, P.gold, 1);
    const star = wallR(1.07, 83); ctx.fillStyle = P.gold;
    ctx.fillRect(Math.round(star.x) - 1, Math.round(star.y) - 4, 2, 8); ctx.fillRect(Math.round(star.x) - 4, Math.round(star.y) - 1, 8, 2); ctx.fillRect(Math.round(star.x) - 2, Math.round(star.y) - 2, 4, 4);
    drawMiniCard(ctx, wallR(1.07, 66), week.rarita || week.rarity, false);
    posterBand(ctx, wallR, 0.72, 1.42, 52, 49.5, "rgba(255,255,255,0.85)");
    posterBand(ctx, wallR, 0.82, 1.32, 47.5, 45.8, "rgba(243,199,106,0.7)");
  }
  if (ban) {
    posterPanel(ctx, wallR, 1.8, 2.85, 92, 42, "#33203a");
    quadFill(ctx, [wallR(1.88, 89), wallR(2.77, 89), wallR(2.77, 45), wallR(1.88, 45)], false, "#a85a5a", 1);
    drawMiniCard(ctx, wallR(2.32, 66), ban.rarita || ban.rarity, true);
    const hammer = wallR(2.62, 50); ctx.save(); ctx.translate(hammer.x, hammer.y); ctx.rotate(Math.atan2(HTH, HTW) - 0.7);
    ctx.fillStyle = P.woodD; ctx.fillRect(-1.5, -2, 3, 16); ctx.fillStyle = P.metal; ctx.fillRect(-6, -7, 12, 6); ctx.fillStyle = P.metalL; ctx.fillRect(-6, -7, 12, 2); ctx.restore();
    posterBand(ctx, wallR, 1.97, 2.67, 52, 49.5, "rgba(255,255,255,0.7)");
    posterBand(ctx, wallR, 2.07, 2.57, 47.5, 45.8, "rgba(224,58,48,0.8)");
  }
}

export function drawPennants(ctx) {
  const pennant = (column, color) => {
    for (let i = 0; i < 5; i += 1) {
      const h0 = WALL_H - 6 - i * 12, h1 = h0 - 10;
      quadFill(ctx, [wallR(column - 0.08, h0), wallR(column + 0.08, h0), wallR(column + 0.08, h1), wallR(column - 0.08, h1)], i % 2 ? shade(color, 0.65) : color);
    }
  };
  pennant(3.5, P.red); pennant(7.5, P.gold); pennant(10.8, "#4a7fd6");
}

export function drawStatsClipboard(ctx, stats) {
  if (!stats) return;
  /* Rettangolo preservato: [wallL(3.3,88), wallL(4.7,88),
   * wallL(4.7,50), wallL(3.3,50)]. Nessun dato di esempio viene introdotto. */
  quadFill(ctx, [wallL(3.37, 85), wallL(4.77, 85), wallL(4.77, 47), wallL(3.37, 47)], "rgba(40,32,60,0.22)");
  quadFill(ctx, [wallL(3.3, 88), wallL(4.7, 88), wallL(4.7, 50), wallL(3.3, 50)], P.woodD);
  quadFill(ctx, [wallL(3.4, 84), wallL(4.6, 84), wallL(4.6, 54), wallL(3.4, 54)], P.paper);
  const clip = wallL(4.0, 88); ctx.fillStyle = P.metalL; ctx.fillRect(Math.round(clip.x) - 5, Math.round(clip.y), 10, 4); ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(clip.x) - 5, Math.round(clip.y) + 3, 10, 1);
  const playedRaw = Number(stats.giocati), winsRaw = Number(stats.vinti);
  const played = Number.isFinite(playedRaw) ? Math.max(0, Math.floor(playedRaw)) : 0;
  const wins = Number.isFinite(winsRaw) ? Math.max(0, Math.min(played, Math.floor(winsRaw))) : 0;
  const hasGames = played > 0 && Number.isFinite(winsRaw);
  const center = wallL(4.0, 69);
  ctx.save(); ctx.translate(center.x, center.y); ctx.rotate(-0.32); ctx.fillStyle = P.ink; ctx.font = "bold 7px 'Courier New', monospace"; ctx.textAlign = "center";
  ctx.fillText("STATS", 0, -10);
  if (hasGames) {
    const width = Math.round(26 * wins / played); ctx.fillStyle = P.leaf; ctx.fillRect(-13, -5, width, 3); ctx.fillStyle = P.red; ctx.fillRect(-13 + width, -5, 26 - width, 3);
  } else {
    ctx.fillStyle = "#c4b9a5"; ctx.fillRect(-13, -5, 26, 3);
  }
  ctx.fillStyle = P.ink; ctx.font = "6px 'Courier New', monospace";
  ctx.fillText(hasGames ? `W${wins} L${played - wins}` : "0/0", 0, 5);
  ctx.fillText(hasGames ? `WR ${Math.round((wins / played) * 100)}%` : "WR --", 0, 12); ctx.restore();
}

export function drawIntercom(ctx) {
  /* Rettangolo preservato esattamente per hit-test: c10.5..11.2, h64..40. */
  quadFill(ctx, [wallR(10.5, 64), wallR(11.2, 64), wallR(11.2, 40), wallR(10.5, 40)], P.metal);
  quadFill(ctx, [wallR(10.55, 62), wallR(11.15, 62), wallR(11.15, 42), wallR(10.55, 42)], P.metalD);
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
  for (const hh of [57, 54, 51]) { const a = wallR(10.62, hh), b = wallR(11.08, hh); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
  const button = wallR(10.85, 46); ctx.fillStyle = P.gold; ctx.fillRect(Math.round(button.x) - 2, Math.round(button.y) - 2, 4, 4);
}

export function drawWallArt(ctx, phase, stats, posters) {
  drawWindow(ctx, phase); drawBrandPoster(ctx); drawMirror(ctx); drawDynamicPosters(ctx, posters); drawPennants(ctx); drawStatsClipboard(ctx, stats);
}
