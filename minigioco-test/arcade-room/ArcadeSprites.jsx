import { mkSprite, isoBox, quadFill, shade, hexA, isoVec, mkCanvas, wallR } from "./iso-draw.js";
import { P_ARCADE as P } from "./arcade-config.js";
import { mkCabinet, CABINETS } from "./arcade-cabinets";

export function buildArcadeFurniture() {
  const out = {};
  for (const c of CABINETS) out[c.key] = mkCabinet(c.accent, c.screenBg, c.screenGlow, c.name, c.icon, c.drawScreen);
  return { ...out, kakeTable: mkKakeguruiTable(), sofa: mkSofa(), ticket: mkTicketMachine(), popcorn: mkPopcorn() };
}

/* Tavolo duello kakegurui 2x2 con due sedie contrapposte (nord/sud) a terra. */
function mkKakeguruiTable() {
  return mkSprite(2, 2, 76, (ctx) => {
    /* sedia dietro (nord): disegnata prima, il tavolo la copre in parte */
    mkChairSprite(ctx, 0.8, -0.55, true);

    /* tavolo */
    isoBox(ctx, 0, 0, 2, 2, 24, P.woodD, { top: P.wood, left: shade(P.woodD, 0.9), right: shade(P.woodD, 0.7) });
    isoBox(ctx, 0.08, 0.08, 1.84, 1.84, 2, P.felt, { z: 24, top: P.feltL, left: P.feltD, right: P.feltD, noEdge: true });
    const inset = (i, dy) => [
      { x: isoVec(i, i).x, y: isoVec(i, i).y - dy }, { x: isoVec(2 - i, i).x, y: isoVec(2 - i, i).y - dy },
      { x: isoVec(2 - i, 2 - i).x, y: isoVec(2 - i, 2 - i).y - dy }, { x: isoVec(i, 2 - i).x, y: isoVec(i, 2 - i).y - dy },
    ];
    quadFill(ctx, inset(0.12, 24), P.red);
    quadFill(ctx, inset(0.18, 24), P.felt);
    const c = isoVec(1, 1);
    ctx.fillStyle = hexA(P.neonPink, 0.55); ctx.font = "14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🎴", c.x, c.y - 22);
    const chip = (tx, ty, col) => { const p = isoVec(tx, ty); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(p.x, p.y - 26, 4, 2.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 27, 2, 1); };
    chip(0.35, 0.65, P.neonBlue); chip(0.45, 0.72, P.neonPink); chip(0.55, 0.68, P.neonYellow);
    chip(1.45, 1.35, P.neonGreen); chip(1.55, 1.28, P.neonPurple);
    const card = (tx, ty, col) => { const z = 26; const p = isoVec(tx, ty); const pts = [{ x: p.x, y: p.y - z }, { x: p.x + 8, y: p.y - 4 - z }, { x: p.x + 8, y: p.y + 4 - z }, { x: p.x, y: p.y + 8 - z }]; quadFill(ctx, pts, col); quadFill(ctx, pts, false, "rgba(0,0,0,0.35)", 1); };
    card(0.65, 1.35, "#4a7fd6"); card(1.25, 0.55, P.red); card(0.85, 0.95, "#9a6ad6");
    /* lampada */
    const lampC = isoVec(1, 1);
    ctx.strokeStyle = P.metalD; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lampC.x, lampC.y - 26); ctx.lineTo(lampC.x, lampC.y - 52); ctx.stroke();
    quadFill(ctx, [{ x: lampC.x - 14, y: lampC.y - 60 }, { x: lampC.x + 14, y: lampC.y - 60 }, { x: lampC.x + 18, y: lampC.y - 48 }, { x: lampC.x - 18, y: lampC.y - 48 }], P.metal);
    quadFill(ctx, [{ x: lampC.x - 12, y: lampC.y - 48 }, { x: lampC.x + 12, y: lampC.y - 48 }, { x: lampC.x + 14, y: lampC.y - 46 }, { x: lampC.x - 14, y: lampC.y - 46 }], hexA(P.neonGreen, 0.7));

    /* sedia davanti (sud): disegnata per ultima, sopra al tavolo */
    mkChairSprite(ctx, 0.8, 2.15, false);
  });
}

/* Sedia da poker: 4 gambe, seduta e schienale. backNorth = schienale a nord. */
function mkChairSprite(ctx, tx, ty, backNorth) {
  const w = 0.42, d = 0.42;
  for (const [lx, ly] of [[0.03, 0.03], [w - 0.09, 0.03], [0.03, d - 0.09], [w - 0.09, d - 0.09]])
    isoBox(ctx, tx + lx, ty + ly, 0.06, 0.06, 9, P.woodD, { noEdge: true });
  isoBox(ctx, tx, ty, w, d, 3, P.sofa, { z: 9, top: P.sofaL, left: shade(P.sofa, 0.9), right: shade(P.sofa, 0.75) });
  const by = backNorth ? ty : ty + d - 0.08;
  isoBox(ctx, tx, by, w, 0.08, 13, P.sofaD, { z: 12, top: P.sofa, noEdge: true });
}

/* Divanetto rosso 2 posti, snello e su piedini: silhouette pulita (schienale
   sottile, braccioli bassi, due cuscini separati) così non sembra un blocco
   fuso con gli arredi vicini. */
function mkSofa() {
  const L = 6; // altezza piedini
  return mkSprite(2, 1, 44, (ctx) => {
    /* piedini metallici */
    for (const [lx, ly] of [[0.14, 0.2], [1.78, 0.2], [0.14, 0.78], [1.78, 0.78]])
      isoBox(ctx, lx, ly, 0.08, 0.08, L, P.metalD, { noEdge: true });
    /* schienale sottile e alto (lato nord) */
    isoBox(ctx, 0.1, 0.14, 1.8, 0.14, 23, P.sofaD, { z: L, top: P.sofa, left: shade(P.sofa, 0.82), right: shade(P.sofa, 0.66) });
    /* due cuscini schienale */
    isoBox(ctx, 0.22, 0.2, 0.7, 0.1, 15, P.sofa, { z: L + 7, top: P.sofaL, left: shade(P.sofa, 0.9), noEdge: true });
    isoBox(ctx, 1.08, 0.2, 0.7, 0.1, 15, P.sofa, { z: L + 7, top: P.sofaL, left: shade(P.sofa, 0.9), noEdge: true });
    /* braccioli bassi e sottili */
    isoBox(ctx, 0.1, 0.18, 0.14, 0.74, 13, P.sofa, { z: L, top: P.sofaL, left: shade(P.sofa, 0.82), right: shade(P.sofa, 0.66) });
    isoBox(ctx, 1.76, 0.18, 0.14, 0.74, 13, P.sofa, { z: L, top: P.sofaL, left: shade(P.sofa, 0.82), right: shade(P.sofa, 0.66) });
    /* base seduta (slab sottile) */
    isoBox(ctx, 0.22, 0.3, 1.56, 0.6, 6, P.sofaD, { z: L, top: shade(P.sofa, 0.85), noEdge: true });
    /* due cuscini seduta separati da una fessura centrale */
    isoBox(ctx, 0.28, 0.34, 0.64, 0.52, 7, P.sofa, { z: L + 6, top: P.sofaL, left: shade(P.sofa, 0.88), right: shade(P.sofa, 0.7) });
    isoBox(ctx, 1.08, 0.34, 0.64, 0.52, 7, P.sofa, { z: L + 6, top: P.sofaL, left: shade(P.sofa, 0.88), right: shade(P.sofa, 0.7) });
  });
}

/* Distributore gettoni 1x1. */
function mkTicketMachine() {
  return mkSprite(1, 1, 70, (ctx) => {
    isoBox(ctx, 0.1, 0.1, 0.8, 0.8, 52, P.cabinet, { top: P.cabinetL });
    const c = isoVec(0.5, 0.5);
    const pane = [{ x: c.x - 10, y: c.y - 50 }, { x: c.x + 10, y: c.y - 50 }, { x: c.x + 10, y: c.y - 16 }, { x: c.x - 10, y: c.y - 16 }];
    quadFill(ctx, pane, hexA(P.neonYellow, 0.15));
    ctx.strokeStyle = P.neonYellow; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pane[0].x, pane[0].y); ctx.lineTo(pane[1].x, pane[1].y); ctx.lineTo(pane[2].x, pane[2].y); ctx.lineTo(pane[3].x, pane[3].y); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = P.neonYellow; for (let i = 0; i < 8; i++) { const y = c.y - 46 + i * 4; ctx.fillRect(Math.round(c.x) - 5, Math.round(y), 10, 2); }
    ctx.fillStyle = P.neonPink; ctx.fillRect(Math.round(c.x - 8), Math.round(c.y - 14), 16, 10);
    // ticket disegnato (cartoncino con tacche e linea)
    ctx.fillStyle = "#fdf3d0"; ctx.fillRect(Math.round(c.x - 6), Math.round(c.y - 12), 12, 6);
    ctx.fillStyle = P.neonPink; ctx.fillRect(Math.round(c.x - 6), Math.round(c.y - 10), 1, 2); ctx.fillRect(Math.round(c.x + 5), Math.round(c.y - 10), 1, 2);
    ctx.fillStyle = "#c9a834"; ctx.fillRect(Math.round(c.x - 3), Math.round(c.y - 10), 6, 1);
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(Math.round(c.x - 6), Math.round(c.y - 2), 12, 3);
    ctx.fillStyle = P.neonYellow; ctx.fillRect(Math.round(c.x - 5), Math.round(c.y - 1), 10, 1);
    ctx.fillStyle = P.neonBlue; ctx.beginPath(); ctx.arc(c.x, c.y + 8, 3, 0, Math.PI * 2); ctx.fill();
  });
}

/* Sgabello-vassoio popcorn 1x1: stand scuro con secchiello a strisce. */
function mkPopcorn() {
  return mkSprite(1, 1, 48, (ctx) => {
    /* stand scuro */
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 20, P.cabinet, { top: P.cabinetL, left: shade(P.cabinet, 0.9), right: shade(P.cabinet, 0.7) });
    const c = isoVec(0.5, 0.5);
    /* secchiello a strisce */
    ctx.fillStyle = P.red; ctx.beginPath();
    ctx.moveTo(c.x - 8, c.y - 32); ctx.lineTo(c.x + 8, c.y - 32); ctx.lineTo(c.x + 6, c.y - 14); ctx.lineTo(c.x - 6, c.y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; for (const y of [-29, -25, -21, -17]) ctx.fillRect(Math.round(c.x) - 7, Math.round(c.y) + y, 14, 2);
    ctx.fillStyle = P.popcorn; const pops = [[-5, -35], [0, -37], [5, -35], [-3, -33], [3, -33], [-6, -31], [6, -31], [-1, -38], [2, -36]];
    for (const [dx, dy] of pops) ctx.fillRect(Math.round(c.x + dx), Math.round(c.y + dy), 3, 3);
  });
}

/* Porta dalla Sala Tornei verso la Sala Arcade. Disegnata come un vano aperto:
   stipite illuminato, anta socchiusa e un "assaggio" della sala arcade oltre
   (pavimento neon + sagome dei cabinati) per dare continuita'. */
export function buildDoorArcade() {
  const pad = 6;
  const topL = wallR(10.5, 90), topR = wallR(11.5, 90);
  const botL = wallR(10.5, 34), botR = wallR(11.5, 34);
  const bbLeft = topL.x, bbTop = topL.y;
  const bbW = topR.x - topL.x, bbH = botR.y - bbTop;
  const doorW = bbW, doorH = 90 - 34;

  const cv = mkCanvas(Math.ceil(bbW) + pad * 2, Math.ceil(bbH) + pad * 2);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(1, 0.5, 0, 1, pad, pad);

  /* stipite / cornice */
  ctx.fillStyle = shade(P.cabinet, 1.15); ctx.fillRect(0, 0, doorW, doorH);
  ctx.fillStyle = shade(P.cabinet, 0.7); ctx.fillRect(0, 0, doorW, doorH); // base scura
  ctx.fillStyle = shade(P.cabinet, 1.25);
  ctx.fillRect(0, 0, 3, doorH); ctx.fillRect(doorW - 3, 0, 3, doorH); ctx.fillRect(0, 0, doorW, 3);

  /* vano interno */
  const ox = 3, oy = 3, ow = doorW - 6, oh = doorH - 5;
  ctx.fillStyle = "#070712"; ctx.fillRect(ox, oy, ow, oh);

  /* assaggio della sala oltre la porta */
  ctx.save();
  ctx.beginPath(); ctx.rect(ox, oy, ow, oh); ctx.clip();
  /* glow ambientale */
  const gg = ctx.createLinearGradient(0, oy, 0, oy + oh);
  gg.addColorStop(0, "rgba(5,217,232,0.04)"); gg.addColorStop(0.55, "rgba(5,217,232,0.16)"); gg.addColorStop(1, "rgba(255,42,109,0.14)");
  ctx.fillStyle = gg; ctx.fillRect(ox, oy, ow, oh);
  /* pavimento neon in fondo */
  ctx.fillStyle = "#12122a"; ctx.fillRect(ox, oy + oh - 12, ow, 12);
  ctx.strokeStyle = hexA(P.neonPink, 0.5); ctx.lineWidth = 1;
  for (const yy of [oy + oh - 9, oy + oh - 5, oy + oh - 1]) { ctx.beginPath(); ctx.moveTo(ox, yy); ctx.lineTo(ox + ow, yy); ctx.stroke(); }
  /* sagome dei cabinati con schermo acceso */
  const cab = (cx, col) => {
    ctx.fillStyle = "#0d0d1a"; ctx.fillRect(cx, oy + 6, 5, oh - 18);
    ctx.fillStyle = hexA(col, 0.9); ctx.fillRect(cx + 1, oy + 9, 3, 6);
    ctx.fillStyle = hexA(col, 0.3); ctx.fillRect(cx, oy + 6, 5, oh - 18);
  };
  cab(ox + ow * 0.18, P.neonBlue); cab(ox + ow * 0.46, P.neonGreen); cab(ox + ow * 0.72, P.neonPurple);
  ctx.restore();

  /* anta socchiusa sul lato sinistro */
  ctx.fillStyle = shade(P.cabinet, 0.85); ctx.fillRect(ox, oy, 4, oh);
  ctx.strokeStyle = P.neonPink; ctx.lineWidth = 1; ctx.strokeRect(ox + 0.5, oy + 0.5, 4, oh - 1);

  /* bordo neon del vano + maniglia */
  ctx.strokeStyle = P.neonPink; ctx.lineWidth = 2; ctx.strokeRect(1, 1, doorW - 2, doorH - 2);
  ctx.fillStyle = P.neonYellow; ctx.fillRect(ox + 6, oy + oh / 2 - 3, 2, 6);

  /* insegna */
  ctx.fillStyle = P.neonPink; ctx.font = "6px 'Press Start 2P', monospace"; ctx.textAlign = "center";
  ctx.fillText("🕹️", doorW / 2, oy + 12);

  return { cv, wx: bbLeft - pad, wy: bbTop - pad };
}
