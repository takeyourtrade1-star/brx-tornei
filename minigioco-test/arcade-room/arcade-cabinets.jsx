import { mkSprite, isoBox, quadFill, shade, hexA, isoVec } from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";

/* Cabinato arcade verticale: plinto, torre, deck comandi sporgente, schermo
   incassato, marquee illuminato in cima e profili neon. */
export function mkCabinet(accent, screenBg, screenGlow, name, icon, drawScreen) {
  return mkSprite(2, 1, 104, (ctx) => {
    const X0 = 0.5, Y0 = 0.2, W = 1.0, D = 0.6;          // torre
    const front = (u, hh) => { const p = isoVec(X0 + u * W, Y0 + D); return { x: p.x, y: p.y - hh }; };

    /* plinto */
    isoBox(ctx, X0 - 0.06, Y0 - 0.02, W + 0.12, D + 0.06, 8, P.cabinetD, { top: shade(P.cabinet, 0.85), noEdge: true });
    /* torre principale */
    isoBox(ctx, X0, Y0, W, D, 74, P.cabinet, {
      top: P.cabinetL, left: shade(P.cabinet, 0.96), right: shade(P.cabinet, 0.66),
    });
    /* profili neon sui due spigoli frontali */
    ctx.strokeStyle = hexA(accent, 0.85); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(front(0.04, 6).x, front(0.04, 6).y); ctx.lineTo(front(0.04, 74).x, front(0.04, 74).y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(front(0.96, 6).x, front(0.96, 6).y); ctx.lineTo(front(0.96, 74).x, front(0.96, 74).y); ctx.stroke();

    /* — schermo incassato — */
    const bezel = [front(0.12, 66), front(0.88, 66), front(0.88, 32), front(0.12, 32)];
    quadFill(ctx, bezel, "#05050c");
    const sw = [front(0.18, 62), front(0.82, 62), front(0.82, 36), front(0.18, 36)];
    quadFill(ctx, sw, screenBg);
    drawScreen(ctx, sw);
    /* scanline + glow */
    ctx.save();
    quadFill(ctx, sw, false, screenGlow, 1); ctx.clip();
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1;
    for (let h = 36; h < 62; h += 3) { const a = front(0.18, h), b = front(0.82, h); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    ctx.restore();
    quadFill(ctx, bezel, false, hexA(accent, 0.5), 1);

    /* griglie altoparlante sotto il marquee */
    ctx.strokeStyle = hexA(accent, 0.4); ctx.lineWidth = 1;
    for (const u of [0.26, 0.74]) for (let k = 0; k < 3; k++) {
      const a = front(u - 0.06, 71 - k * 1.5), b = front(u + 0.06, 71 - k * 1.5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    /* — deck comandi sporgente — */
    const deck = isoBox(ctx, X0 + 0.02, Y0 + D - 0.04, W - 0.04, 0.3, 6, shade(P.cabinet, 1.1), { z: 22, top: P.cabinetL });
    const dc = { x: (deck.up(deck.T).x + deck.up(deck.B).x) / 2, y: (deck.up(deck.T).y + deck.up(deck.B).y) / 2 };
    /* joystick */
    ctx.fillStyle = "#0d0d1a"; ctx.beginPath(); ctx.ellipse(dc.x - 8, dc.y + 2, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = P.metalL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(dc.x - 8, dc.y + 1); ctx.lineTo(dc.x - 8, dc.y - 5); ctx.stroke();
    ctx.fillStyle = P.red; ctx.beginPath(); ctx.arc(dc.x - 8, dc.y - 6, 2.4, 0, Math.PI * 2); ctx.fill();
    /* bottoni */
    const btn = [[2, accent], [8, P.neonYellow], [13, P.neonPink]];
    for (const [dx, col] of btn) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(dc.x + dx, dc.y + 1, 2.4, 1.6, 0, 0, Math.PI * 2); ctx.fill(); }

    /* gettoniera */
    const coin = front(0.5, 16);
    ctx.fillStyle = P.metal; ctx.fillRect(Math.round(coin.x) - 6, Math.round(coin.y) - 6, 12, 9);
    ctx.fillStyle = P.neonYellow; ctx.fillRect(Math.round(coin.x) - 3, Math.round(coin.y) - 3, 6, 1.5);

    /* — marquee illuminato — */
    const mar = isoBox(ctx, X0 - 0.04, Y0 + 0.04, W + 0.08, D - 0.08, 15, shade(accent, 0.5), {
      z: 74, top: shade(accent, 1.2), left: accent, right: shade(accent, 0.7), noEdge: true,
    });
    const mc = front(0.5, 84);
    ctx.save();
    ctx.shadowColor = accent; ctx.shadowBlur = 6;
    ctx.fillStyle = "#0d0d1a";
    ctx.font = "bold 6px 'Press Start 2P', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(name, mc.x, mc.y + 1);
    ctx.restore();
  });
}

function drawStackScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = "#00ff9d";
  for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(c.x) - 7 + i, Math.round(c.y) + 8 - i * 5, 14 - i * 2, 4);
}
function drawJumpScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  ctx.fillStyle = "#39ff14";
  ctx.fillRect(Math.round(c.x) - 5, Math.round(c.y) + 6, 10, 8);
  ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y) - 2, 6, 4);
  ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(c.x) - 1, Math.round(c.y) - 6, 2, 2);
}
function drawMemoryScreen(ctx, sw) {
  const c = { x: (sw[0].x + sw[2].x) / 2, y: (sw[0].y + sw[2].y) / 2 };
  const seed = [1, 0, 1, 0, 0, 1, 0, 1, 1]; let k = 0;
  for (let x = -8; x <= 8; x += 8) for (let y = -10; y <= 10; y += 8) {
    ctx.fillStyle = "#b026ff"; ctx.fillRect(Math.round(c.x) + x - 3, Math.round(c.y) + y - 4, 6, 8);
    ctx.fillStyle = seed[k++] ? "#fff" : "#b026ff"; ctx.fillRect(Math.round(c.x) + x - 1, Math.round(c.y) + y - 2, 2, 2);
  }
}
export const CABINETS = [
  { key: "cabinet1", accent: P.neonBlue, screenBg: "#04231f", screenGlow: "#00ff9d", name: "STACK", icon: "🃏", drawScreen: drawStackScreen },
  { key: "cabinet2", accent: P.neonGreen, screenBg: "#041f12", screenGlow: "#39ff14", name: "JUMP", icon: "🍄", drawScreen: drawJumpScreen },
  { key: "cabinet3", accent: P.neonPurple, screenBg: "#1f0420", screenGlow: "#b026ff", name: "MEMORY", icon: "🧠", drawScreen: drawMemoryScreen },
];
