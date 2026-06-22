/* ============================================================================
   ArcadeSprites — buildArcadeFurniture(): sprite pixel-art dei arredi della
   Sala Arcade (3 cabinati, tavolo kakegurui, divano, distributore, popcorn).
   buildDoorArcade(): sprite della porta sulla parete destra della Sala Tornei.
   Restituisce sprite raw ({ cv, ax, ay }); il motore applica outlined().
   ========================================================================== */

import { mkSprite, isoBox, quadFill, shade, hexA, isoVec, mkCanvas } from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";

export function buildArcadeFurniture() {
  const cabinet1 = mkCabinet(P.neonBlue, "#04231f", "#00ff9d");
  const cabinet2 = mkCabinet(P.neonGreen, "#041f12", "#39ff14");
  const cabinet3 = mkCabinet(P.neonPurple, "#1f0420", "#b026ff");
  const kakeTable = mkKakeguruiTable();
  const sofa = mkSofa();
  const ticket = mkTicketMachine();
  const popcorn = mkPopcorn();
  return { cabinet1, cabinet2, cabinet3, kakeTable, sofa, ticket, popcorn };
}

/* Cabinato arcade 2x1: base, schermo luminoso frontale, marquee, joystick. */
function mkCabinet(accent, screenBg, screenGlow) {
  return mkSprite(2, 1, 78, (ctx) => {
    isoBox(ctx, 0, 0, 2, 1, 30, P.cabinet, { top: P.cabinetL, left: shade(P.cabinet, 0.9), right: shade(P.cabinet, 0.7) });
    /* pannello di controllo inclinato sul frontale */
    isoBox(ctx, 0.3, 0.96, 1.4, 0.06, 4, shade(P.cabinet, 0.8), { z: 30, noEdge: true });
    /* joystick + bottoni sul pannello */
    const j = isoVec(1, 1);
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(Math.round(j.x) - 2, Math.round(j.y) - 33, 4, 4);
    ctx.fillStyle = accent; ctx.fillRect(Math.round(j.x) - 1, Math.round(j.y) - 36, 2, 3);
    for (const [dx, col] of [[-12, accent], [-6, "#ff2a6d"], [10, "#fff01f"]]) {
      ctx.fillStyle = col; ctx.fillRect(Math.round(j.x + dx), Math.round(j.y) - 33, 3, 3);
    }
    /* schermo frontale (faccia a sinistra, ty=1) */
    const sL = isoVec(0, 1), sB = isoVec(2, 1);
    const sq = (s, hh) => ({ x: sL.x + s * (sB.x - sL.x), y: sL.y + s * (sB.y - sL.y) - hh });
    const sw = [sq(0.12, 72), sq(0.88, 72), sq(0.88, 42), sq(0.12, 42)];
    quadFill(ctx, sw, screenBg);
    /* scanline + bagliore schermo */
    ctx.save();
    quadFill(ctx, sw, false, screenGlow, 1);
    ctx.clip();
    ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1;
    for (let h = 44; h < 72; h += 3) {
      const a = sq(0.12, h), b = sq(0.88, h);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    ctx.restore();
    /* marquee in cima con nome (barra luminosa accent) */
    const mL = isoVec(0, 0), mR = isoVec(2, 0), mB = isoVec(2, 1), mT = isoVec(0, 1);
    const mq = (s, hh) => ({ x: mT.x + s * (mR.x - mT.x), y: mT.y + s * (mR.y - mT.y) - hh });
    quadFill(ctx, [mq(0.1, 82), mq(0.9, 82), mq(0.9, 74), mq(0.1, 74)], accent);
    ctx.fillStyle = "#0d0d1a";
    ctx.font = "5px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("▶", mq(0.5, 78).x, mq(0.5, 78).y + 2);
  });
}

/* Tavolo duello kakegurui 2x2: piano felt verde, bordo legno, due sedie. */
function mkKakeguruiTable() {
  return mkSprite(2, 2, 52, (ctx) => {
    isoBox(ctx, 0, 0, 2, 2, 22, P.woodD, { top: P.wood, left: shade(P.woodD, 0.9), right: shade(P.woodD, 0.7) });
    isoBox(ctx, 0.15, 0.15, 1.7, 1.7, 2, P.felt, { z: 22, top: P.feltL, left: P.feltD, right: P.feltD, noEdge: true });
    /* simboli sasso/carta/forbice sul feltro */
    const c = isoVec(1, 1);
    ctx.fillStyle = hexA(P.neonPink, 0.5);
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎴", c.x, c.y - 20);
    /* sedie ai lati corti */
    mkChairSprite(ctx, -0.4, 0.6);
    mkChairSprite(ctx, 2.0, 1.4, true);
  });
}

function mkChairSprite(ctx, tx, ty, flip = false) {
  isoBox(ctx, tx, ty, 0.5, 0.5, 10, P.cabinet, { top: P.cabinetL, noEdge: true });
  isoBox(ctx, tx + (flip ? 0.3 : 0), ty, 0.2, 0.5, 16, P.cabinetD, { z: 10, noEdge: true });
}

/* Divanetto rosso 2x1. */
function mkSofa() {
  return mkSprite(2, 1, 36, (ctx) => {
    isoBox(ctx, 0, 0, 2, 1, 14, P.sofa, { top: P.sofaL, left: shade(P.sofa, 0.9), right: shade(P.sofa, 0.75) });
    isoBox(ctx, 0, 0, 2, 0.2, 20, P.sofaD, { z: 14, noEdge: true });
    isoBox(ctx, 0, 0.8, 2, 0.2, 20, P.sofaD, { z: 14, noEdge: true });
    isoBox(ctx, 0.1, 0.1, 1.8, 0.8, 5, P.sofaL, { z: 14, noEdge: true });
  });
}

/* Distributore gettoni 1x1. */
function mkTicketMachine() {
  return mkSprite(1, 1, 64, (ctx) => {
    isoBox(ctx, 0, 0, 0.8, 0.8, 48, P.cabinet, { top: P.cabinetL });
    /* schermo prezzi */
    const c = isoVec(0.4, 0.4);
    ctx.fillStyle = P.neonYellow;
    ctx.fillRect(Math.round(c.x - 8), Math.round(c.y - 42), 16, 12);
    ctx.fillStyle = "#0d0d1a";
    ctx.font = "6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText("🎫", c.x, c.y - 33);
    /* fessura */
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(Math.round(c.x - 5), Math.round(c.y - 18), 10, 3);
    ctx.fillStyle = P.neonYellow;
    ctx.fillRect(Math.round(c.x - 4), Math.round(c.y - 17), 8, 1);
  });
}

/* Cestino popcorn 1x1. */
function mkPopcorn() {
  return mkSprite(1, 1, 40, (ctx) => {
    isoBox(ctx, 0.2, 0.2, 0.6, 0.6, 16, P.popcornD, { top: P.woodD });
    /* secchiello */
    const c = isoVec(0.5, 0.5);
    ctx.fillStyle = P.red;
    ctx.fillRect(Math.round(c.x - 7), Math.round(c.y - 30), 14, 16);
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.round(c.x - 7), Math.round(c.y - 26), 14, 2);
    ctx.fillRect(Math.round(c.x - 7), Math.round(c.y - 20), 14, 2);
    /* popcorn */
    ctx.fillStyle = P.popcorn;
    for (const [dx, dy] of [[-4, -34], [0, -36], [4, -34], [-2, -32], [2, -32]]) {
      ctx.fillRect(Math.round(c.x + dx), Math.round(c.y + dy), 3, 3);
    }
  });
}

/* Porta sulla parete destra della Sala Tornei (verso Sala Arcade).
   Sprite standalone stile buildBoard: { cv, wx, wy }. */
export function buildDoorArcade() {
  const pad = 6;
  const cv = mkCanvas(40, 96);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  /* cornice */
  ctx.fillStyle = shade(P.cabinet, 1.2);
  ctx.fillRect(pad, pad, 28, 84);
  ctx.strokeStyle = P.neonPink; ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, 28, 84);
  /* pannello porta */
  ctx.fillStyle = P.cabinet;
  ctx.fillRect(pad + 3, pad + 3, 22, 78);
  /* maniglia */
  ctx.fillStyle = P.neonPink;
  ctx.fillRect(pad + 20, pad + 42, 3, 5);
  /* etichetta */
  ctx.fillStyle = P.neonPink;
  ctx.font = "6px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.fillText("🕹️", pad + 14, pad + 22);
  /* posizione sulla parete destra: cx=11, cy=4.5 circa */
  const wx = 11 * 32 + 336 - 20;
  const wy = 4.5 * 16 + 150 - 86;
  return { cv, wx: wx - pad, wy: wy - pad };
}
