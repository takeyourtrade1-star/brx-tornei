"use client";
/**
 * IsoRoomGame — stanza isometrica pixel-art con avatar, tornei e deck TCG.
 * (v2: monitor vivo, countdown, ghost, riflesso, orme, foto, gatto, musica)
 * ------------------------------------------------------------------------
 * Drop-in: <IsoRoomGame />  (riempie il container: dagli un'altezza!)
 *
 * Props opzionali:
 *   roomName            string   — nome stanza nell'HUD (default "Sala Tornei")
 *   username            string   — username del giocatore (default "PrincessLeo")
 *   tournaments         array    — sovrascrive i tornei mock (shape identica a
 *                                  tournaments-live-frontend/types/tournament.ts)
 *   decks               array    — sovrascrive i deck mock
 *   cards               array    — sovrascrive l'inventario carte mock
 *   onCreateTournament  (t)=>{}  — chiamata alla pubblicazione di un torneo
 *   onJoinTournament    (id)=>{} — chiamata all'iscrizione a un torneo
 *   onCreateDeck        (d)=>{}  — chiamata alla creazione di un deck
 *
 * Rendering: Canvas 2D puro, grafica 100% procedurale (nessun asset esterno,
 * solo Google Font "Press Start 2P" per i titoli). Niente localStorage.
 */
import React, { useEffect, useRef, useState, useCallback } from "react";

/* ============================== 1. CONFIG ============================== */

const HTW = 32, HTH = 16;            // mezzo-tile (diamante 64x32)
const COLS = 12, ROWS = 10;          // griglia stanza
const WW = 736, WH = 560;            // dimensioni canvas-mondo (px logici)
const OX = 336, OY = 150;            // origine della griglia nel mondo
const WALL_H = 112;                  // altezza pareti
const SPEED = 3.4;                   // velocità avatar (tile/sec)

/* Palette (~24 colori armonici, luce dalla finestra a sinistra) */
const P = {
  bg0: "#191b2e", bg1: "#262a49",
  floorA: "#d9cdaf", floorB: "#cfc2a2", floorLine: "#b9ac8c", floorSide: "#6f6450",
  wall: "#aebfa7", wallDark: "#8da188", wallTop: "#c4d2bb", base: "#8a6a48", baseDark: "#6e5236",
  wood: "#a07848", woodL: "#c09a68", woodD: "#7a5836", woodXD: "#5c4128",
  felt: "#3f7d54", feltD: "#33664a", feltL: "#4f9465",
  metal: "#5a6273", metalL: "#838da1", metalD: "#3f4453",
  screen: "#8fe0ef", screenD: "#3aa8c4", glow: "#bdf3ff",
  cork: "#c89a62", corkD: "#a87c4a",
  paper: "#f7f1dd", paperY: "#f5e29a", paperP: "#f3b8c5",
  red: "#d94f46", redD: "#a83a34", gold: "#f2b94b", goldD: "#c98f2b",
  leaf: "#5d9e4c", leafD: "#3f7a38", pot: "#b56a44", potD: "#8e4f30",
  skin: "#f2c79a", skinD: "#d9a878", hair: "#5a4632", hoodie: "#4ba3a3", hoodieD: "#357d7d",
  pants: "#4a5577", pantsD: "#394260", shoe: "#e8e4da", outline: "#2e2a3a",
  rug: "#a8453e", rugD: "#8a3731", rugL: "#e8d7b0",
  sky: "#aee2f2", skyL: "#e6f6e8",
};

/* Arredi: footprint in tile (bloccano il pathfinding) */
const FURN = [
  { key: "plant", tiles: [[0, 0]] },
  { key: "cam",   tiles: [[1, 2]] },   // in diagonale, punta verso la sedia
  { key: "desk",  tiles: [[0, 3], [0, 4], [0, 5]], inter: "pc" },
  { key: "cam2",  tiles: [[1, 6]] },   // in diagonale, vista da dietro
  { key: "chair", tiles: [[1, 4]] },
  { key: "table", tiles: [[7, 3], [8, 3], [7, 4], [8, 4]], inter: "decks" },
  { key: "stool", tiles: [[6, 3]] },
  { key: "stool2",tiles: [[9, 4]] },
  { key: "lamp",  tiles: [[11, 0]] },
  { key: "turn",  tiles: [[10, 1]] },   // giradischi
];

/* Oggetti interattivi (la bacheca è sul muro: footprint vuoto) */
const INTERACTIVES = {
  pc:    { name: "PC",               icon: "🖥️", desc: "Tornei Live",
           approach: [[1, 3], [1, 5]], footTiles: [[0, 3], [0, 4], [0, 5]],
           focus: { x: 200, y: 190, z: 1.62 }, faceTile: [0, 4] },
  decks: { name: "Tavolo delle carte", icon: "🃏", desc: "I miei Deck",
           approach: [[6, 4], [9, 3], [7, 2], [8, 2], [7, 5], [8, 5]],
           footTiles: [[7, 3], [8, 3], [7, 4], [8, 4]],
           focus: { x: 464, y: 322, z: 1.55 }, faceTile: [7.5, 3.5] },
  board: { name: "Bacheca",          icon: "📌", desc: "Crea Torneo",
           approach: [[3, 0], [4, 0], [5, 0]], footTiles: [],
           focus: { x: 472, y: 158, z: 1.6 }, faceTile: null },
};

/* Giradischi: interattivo "leggero" (toggle musica, nessuna modale) */
const MUSIC_OBJ = { id: "music", approach: [[9, 1], [10, 2], [11, 2], [9, 0]], faceTile: [10, 1] };

/* Battute degli easter egg (oggetti decorativi cliccabili) */
const EGG_LINES = {
  plant: ["Una pianta finta: zero mana, zero manutenzione 🌿", "Le racconto le mie sconfitte. Non giudica mai.", "Foglia-counter: ancora imbattuta."],
  lamp: ["Illuminazione da torneo professionale 💡", "Accesa dal 2019. Nessuno trova l'interruttore.", "Lume di candela? No, lume di meta."],
  cam: ["📹 Sorridi, sei su Ebartex TV!", "La regia inquadra solo le mie vittorie.", "REC… meglio non fare misplay adesso."],
  cam2: ["Questa telecamera riprende il mio lato migliore.", "📹 Angolo B: per i replay delle giocate epiche."],
  chair: ["La sedia del campione. La sto scaldando per me.", "Ergonomica, dicono. Il mio collo dissente.", "5 ruote, 0 sconfitte."],
  stool: ["Uno sgabello onesto, senza pretese.", "Riservato agli sfidanti.", "Tre gambe e tanta umiltà."],
  window: ["Bella giornata… per stare al chiuso a giocare ☀️", "Là fuori c'è un mondo intero senza carte. Che tristezza."],
  windowNight: ["Le stelle stanno guardando. Niente pressione ✨", "Notte perfetta per un'ultima partita. L'ultima davvero, giuro."],
  posterBrand: ["Ebartex: dove i sogni diventano BO3 🧡", "Il poster del capo. Spolverato ogni giorno."],
  posterTcg: ["Tre carte in ventaglio. La quarta è sempre quella che ti serviva.", "Arte astratta? No, topdeck."],
  posterSynth: ["Synthwave: la colonna sonora dei top deck 🌴", "Anno 1986, meta ancora aperto."],
};

/* Battute al risveglio dall'AFK (idle reward) */
const AFK_LINES = [
  "Ho meditato: il prossimo mazzo sarà leggendario 🧘",
  "Che pisolino! Energie al 100% 🔋",
  "Nel sogno ho toppato la combo. Buon segno ✨",
  "Mente lucida, mana pieno. Si gioca.",
];

/* Fase del giorno in base all'ora locale */
function dayPhase(h = new Date().getHours()) {
  if (h >= 6 && h < 9)   return { id: "dawn",  skyTop: "#ffd9a0", skyBot: "#ffeecf", beam: 0.15, amb: "rgba(255,170,110,0.07)", celestial: "sun",  lampBoost: 1.1 };
  if (h >= 9 && h < 17)  return { id: "day",   skyTop: "#aee2f2", skyBot: "#e6f6e8", beam: 0.20, amb: null,                      celestial: "sun",  lampBoost: 1 };
  if (h >= 17 && h < 21) return { id: "dusk",  skyTop: "#f2a05c", skyBot: "#ffd9a8", beam: 0.13, amb: "rgba(130,70,140,0.10)",   celestial: "sun",  lampBoost: 1.2 };
  return                        { id: "night", skyTop: "#101a3a", skyBot: "#1c2c55", beam: 0.05, amb: "rgba(18,26,70,0.22)",     celestial: "moon", lampBoost: 1.5, stars: true };
}

/* ============================ 2. MOCK DATA ============================= */
/* giochi inventati: "Eternal Clash", "Leggende di Aurelia", "Sigilli di Runa" */

/* Tornei: stessa shape di tournaments-live-frontend (types/tournament.ts):
   { id, format, mode, buyIn, bestOf, status, maxPlayers, participants[], createdAt, isPrivate? } */
const tu = (id, username) => ({ id, username });
/* Partite Heads-Up: massimo 2 giocatori per torneo. */
const mockTournaments = () => [
  { id: "t1", format: "modern",     mode: "heads-up", buyIn: "for_fun", bestOf: "BO3", status: "in_registrazione", maxPlayers: 2, createdAt: "2026-06-10T18:30:00Z",
    participants: [tu("p1", "Drakmor92")] },
  { id: "t2", format: "commander",  mode: "heads-up", buyIn: "for_fun", bestOf: "BO1", status: "in_registrazione", maxPlayers: 2, createdAt: "2026-06-11T09:00:00Z", isPrivate: true,
    participants: [tu("p4", "NottePiena")] },
  { id: "t3", format: "legacy",     mode: "heads-up", buyIn: "for_fun", bestOf: "BO5", status: "iniziata",         maxPlayers: 2, createdAt: "2026-06-11T21:15:00Z",
    participants: [tu("p6", "Bastione77"), tu("p7", "ReDiCoppe")] },
  { id: "t4", format: "standard",   mode: "heads-up", buyIn: "for_fun", bestOf: "BO3", status: "iniziata",         maxPlayers: 2, createdAt: "2026-06-12T10:05:00Z",
    participants: [tu("p8", "GoblinKid"), tu("p9", "MirkoLands")] },
  { id: "t5", format: "pioneer",    mode: "heads-up", buyIn: "for_fun", bestOf: "BO3", status: "terminata",        maxPlayers: 2, createdAt: "2026-06-08T16:00:00Z",
    participants: [tu("p10", "LunaMaga"), tu("p11", "Tarlo_TCG")] },
  { id: "t6", format: "old-school", mode: "heads-up", buyIn: "for_fun", bestOf: "BO1", status: "in_registrazione", maxPlayers: 2, createdAt: "2026-06-12T08:40:00Z",
    participants: [] },
  { id: "t7", format: "premodern",  mode: "heads-up", buyIn: "for_fun", bestOf: "BO3", status: "in_registrazione", maxPlayers: 2, createdAt: "2026-06-12T11:20:00Z",
    participants: [tu("p12", "VecchiaScuola68")] },
];

const mockDecks = () => [
  { id: 1, nome: "Aggro Infernale",    carte: 40, colore: "#e0564d", sig: "flame" },
  { id: 2, nome: "Controllo Abissale", carte: 60, colore: "#4a7fd6", sig: "wave" },
  { id: 3, nome: "Midrange Selvaggio", carte: 40, colore: "#5da24e", sig: "leaf" },
  { id: 4, nome: "Combo Astrale",      carte: 40, colore: "#9a6ad6", sig: "star" },
];

const POPULAR_DECKS = [
  { id: 1, nome: "Tempesta di Rune",  autore: "Drakmor92",   uso: 18, winrate: 64, colore: "#4a7fd6", sig: "bolt" },
  { id: 2, nome: "Eredi del Sole",    autore: "LunaMaga",    uso: 14, winrate: 61, colore: "#f2b94b", sig: "sun" },
  { id: 3, nome: "Sciame Famelico",   autore: "Tarlo_TCG",   uso: 11, winrate: 58, colore: "#5da24e", sig: "leaf" },
  { id: 4, nome: "Requiem d'Ombra",   autore: "NottePiena",  uso: 9,  winrate: 66, colore: "#9a6ad6", sig: "moon" },
  { id: 5, nome: "Muraglia Eterna",   autore: "Bastione77",  uso: 7,  winrate: 52, colore: "#9aa3ad", sig: "shield" },
];

const CARD_DEFS = [
  ["Drago di Cenere", "leggendaria", 7, "Creatura", "flame"],
  ["Sigillo Arcano", "rara", 3, "Incantesimo", "star"],
  ["Golem di Rovina", "epica", 6, "Creatura", "shield"],
  ["Fante di Aurelia", "comune", 1, "Creatura", "sun"],
  ["Lama del Crepuscolo", "rara", 2, "Artefatto", "bolt"],
  ["Idra Vorace", "epica", 5, "Creatura", "wave"],
  ["Custode del Bosco", "comune", 2, "Creatura", "leaf"],
  ["Fenice Eterna", "leggendaria", 8, "Creatura", "sun"],
  ["Ladra di Sogni", "rara", 3, "Creatura", "moon"],
  ["Muro di Spine", "comune", 2, "Incantesimo", "leaf"],
  ["Evocatrice Lunare", "epica", 4, "Creatura", "moon"],
  ["Goblin Sabotatore", "comune", 1, "Creatura", "bolt"],
  ["Anello del Vuoto", "rara", 2, "Artefatto", "moon"],
  ["Titano d'Ossidiana", "leggendaria", 9, "Creatura", "shield"],
  ["Sciamana della Pioggia", "comune", 3, "Creatura", "wave"],
  ["Spettro Errante", "comune", 2, "Creatura", "moon"],
  ["Bibliotecaria Arcana", "rara", 4, "Creatura", "star"],
  ["Cavaliere di Smeraldo", "comune", 3, "Creatura", "leaf"],
];
const mockCards = () =>
  CARD_DEFS.map(([nome, rarita, costo, tipo, sig], i) => ({ id: i + 1, nome, rarita, costo, tipo, sig }));

const RAR = {
  comune:      { label: "Comune",      c: "#9aa3ad", g: "#6f7780" },
  rara:        { label: "Rara",        c: "#4a90e2", g: "#2f6cb5" },
  epica:       { label: "Epica",       c: "#a05fd0", g: "#7a3fa8" },
  leggendaria: { label: "Leggendaria", c: "#e8a33d", g: "#c47f1d" },
};

/* ============================== 3. UTILS =============================== */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeOutBack = (t) => Math.max(0, 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2));

/** tile (anche frazionario) -> px mondo del vertice alto del diamante */
const tileTop = (cx, cy) => ({ x: (cx - cy) * HTW + OX, y: (cx + cy) * HTH + OY });
/** px mondo -> tile intero */
const worldToTile = (wx, wy) => {
  const lx = wx - OX, ly = wy - OY;
  return { cx: Math.floor((lx / HTW + ly / HTH) / 2), cy: Math.floor((ly / HTH - lx / HTW) / 2) };
};
const inGrid = (cx, cy) => cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS;
const tkey = (cx, cy) => cx + "," + cy;

/** scurisce/schiarisce un colore hex */
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = clamp(Math.round(r * f + (f > 1 ? 12 : 0)), 0, 255);
  g = clamp(Math.round(g * f + (f > 1 ? 12 : 0)), 0, 255);
  b = clamp(Math.round(b * f + (f > 1 ? 12 : 0)), 0, 255);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/** hex -> rgba con alpha */
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

/** A* 4-direzioni sulla griglia */
function findPath(start, goal, blocked) {
  if (!inGrid(goal.cx, goal.cy) || blocked.has(tkey(goal.cx, goal.cy))) return null;
  if (start.cx === goal.cx && start.cy === goal.cy) return [];
  const open = [{ x: start.cx, y: start.cy, g: 0, f: 0, p: null }];
  const best = new Map([[tkey(start.cx, start.cy), 0]]);
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const n = open.splice(bi, 1)[0];
    if (n.x === goal.cx && n.y === goal.cy) {
      const out = [];
      for (let c = n; c; c = c.p) out.unshift({ cx: c.x, cy: c.y });
      out.shift(); // rimuovi tile di partenza
      return out;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = n.x + dx, ny = n.y + dy;
      if (!inGrid(nx, ny) || blocked.has(tkey(nx, ny))) continue;
      const g = n.g + 1, k = tkey(nx, ny);
      if (best.has(k) && best.get(k) <= g) continue;
      best.set(k, g);
      open.push({ x: nx, y: ny, g, f: g + Math.abs(nx - goal.cx) + Math.abs(ny - goal.cy), p: n });
    }
  }
  return null;
}

/** ordinamento in profondità per footprint rettangolari (assi separatori) */
function cmpDepth(a, b) {
  if (a.maxX < b.minX) return -1;
  if (b.maxX < a.minX) return 1;
  if (a.maxY < b.minY) return -1;
  if (b.maxY < a.minY) return 1;
  return a.maxX + a.maxY - (b.maxX + b.maxY);
}

function mkCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

/* ====================== 4. SPRITE FACTORY (pixel-art) ================== */

const isoVec = (tx, ty) => ({ x: (tx - ty) * HTW, y: (tx + ty) * HTH });

function quadFill(ctx, pts, fill, stroke, lw) {
  ctx.beginPath();
  ctx.moveTo(Math.round(pts[0].x), Math.round(pts[0].y));
  for (let i = 1; i < pts.length; i++) ctx.lineTo(Math.round(pts[i].x), Math.round(pts[i].y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}

/** cuboide isometrico: origine = vertice alto del tile (0,0) locale */
function isoBox(ctx, tx, ty, w, d, h, c, opts = {}) {
  const o = isoVec(tx, ty);
  const z = opts.z || 0;             // sollevamento (es. oggetti appoggiati su un piano)
  o.y -= z;
  const T = { x: o.x, y: o.y };
  const R = { x: o.x + isoVec(w, 0).x, y: o.y + isoVec(w, 0).y };
  const B = { x: o.x + isoVec(w, d).x, y: o.y + isoVec(w, d).y };
  const L = { x: o.x + isoVec(0, d).x, y: o.y + isoVec(0, d).y };
  const up = (p) => ({ x: p.x, y: p.y - h });
  quadFill(ctx, [L, B, up(B), up(L)], opts.left || shade(c, 0.88));
  quadFill(ctx, [B, R, up(R), up(B)], opts.right || shade(c, 0.64));
  quadFill(ctx, [up(T), up(R), up(B), up(L)], opts.top || shade(c, 1.16));
  if (!opts.noEdge) {
    ctx.strokeStyle = opts.edge || "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(L.x), Math.round(L.y - h));
    ctx.lineTo(Math.round(B.x), Math.round(B.y - h));
    ctx.lineTo(Math.round(R.x), Math.round(R.y - h));
    ctx.stroke();
  }
  return { T, R, B, L, up };
}

/** crea sprite con anchor sul vertice alto del suo tile minimo */
function mkSprite(wT, dT, up, draw) {
  const pad = 6;
  const cv = mkCanvas(Math.ceil((wT + dT) * HTW) + pad * 2, Math.ceil((wT + dT) * HTH) + up + pad * 2);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const ax = Math.ceil(dT * HTW) + pad, ay = up + pad;
  ctx.save();
  ctx.translate(ax, ay);
  draw(ctx);
  ctx.restore();
  return { cv, ax, ay };
}

/** contorno scuro 1px attorno allo sprite (stile pixel-art) */
function outlined(sp, color = P.outline) {
  const { cv } = sp;
  const sil = mkCanvas(cv.width, cv.height);
  const sc = sil.getContext("2d");
  sc.drawImage(cv, 0, 0);
  sc.globalCompositeOperation = "source-in";
  sc.fillStyle = color;
  sc.fillRect(0, 0, sil.width, sil.height);
  const out = mkCanvas(cv.width + 2, cv.height + 2);
  const oc = out.getContext("2d");
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) oc.drawImage(sil, dx, dy);
  oc.drawImage(cv, 1, 1);
  return { cv: out, ax: sp.ax + 1, ay: sp.ay + 1 };
}

/** silhouette gialla per il glow di prossimità */
function makeSil(sp, color = "#ffd76e") {
  const sil = mkCanvas(sp.cv.width, sp.cv.height);
  const sc = sil.getContext("2d");
  sc.drawImage(sp.cv, 0, 0);
  sc.globalCompositeOperation = "source-in";
  sc.fillStyle = color;
  sc.fillRect(0, 0, sil.width, sil.height);
  return sil;
}

/* punti sulle pareti: parete sinistra lungo cx=0, parete di fondo lungo cy=0 */
const wallL = (c, hh) => ({ x: -c * HTW + OX, y: c * HTH - hh + OY });
const wallR = (c, hh) => ({ x: c * HTW + OX, y: c * HTH - hh + OY });

/** disegna pavimento + pareti + finestra + poster + tappeto + luce nel bg */
function buildBackground(phase = dayPhase(), stats = null) {
  const cv = mkCanvas(WW, WH);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  /* — pareti — */
  // parete sinistra (in ombra)
  quadFill(ctx, [wallL(0, WALL_H), wallL(ROWS, WALL_H), wallL(ROWS, 0), wallL(0, 0)], P.wallDark);
  // parete di fondo (illuminata dalla finestra)
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], P.wall);
  // gradiente verso l'angolo
  const cg = ctx.createLinearGradient(OX, 0, OX + COLS * HTW, 0);
  cg.addColorStop(0, "rgba(30,30,50,0.18)"); cg.addColorStop(0.5, "rgba(30,30,50,0)");
  ctx.fillStyle = cg;
  quadFill(ctx, [wallR(0, WALL_H), wallR(COLS, WALL_H), wallR(COLS, 0), wallR(0, 0)], cg);
  // giunzioni verticali dei pannelli
  ctx.strokeStyle = "rgba(40,40,60,0.12)";
  ctx.lineWidth = 1;
  for (let c = 2; c < ROWS; c += 2) {
    const a = wallL(c, 10), b = wallL(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }
  for (let c = 2; c < COLS; c += 2) {
    const a = wallR(c, 10), b = wallR(c, WALL_H - 6);
    ctx.beginPath(); ctx.moveTo(a.x + 0.5, a.y); ctx.lineTo(b.x + 0.5, b.y); ctx.stroke();
  }
  // bordo superiore pareti
  quadFill(ctx, [wallL(0, WALL_H + 5), wallL(ROWS, WALL_H + 5), wallL(ROWS, WALL_H), wallL(0, WALL_H)], P.wallTop);
  quadFill(ctx, [wallR(0, WALL_H + 5), wallR(COLS, WALL_H + 5), wallR(COLS, WALL_H), wallR(0, WALL_H)], P.wallTop);
  // colonna d'angolo
  ctx.fillStyle = shade(P.wallDark, 0.8);
  ctx.fillRect(OX - 1, OY - WALL_H - 5, 2, WALL_H + 5);

  /* — finestra sulla parete sinistra — */
  const winGlow = ctx.createRadialGradient(wallL(6.7, 60).x, wallL(6.7, 60).y, 4, wallL(6.7, 60).x, wallL(6.7, 60).y, 70);
  const wgA = (0.22 * phase.beam / 0.2).toFixed(3);
  winGlow.addColorStop(0, "rgba(255,250,220," + wgA + ")"); winGlow.addColorStop(1, "rgba(255,250,220,0)");
  ctx.fillStyle = winGlow;
  ctx.fillRect(wallL(8.6, 110).x, wallL(8.6, 110).y, 180, 140);
  quadFill(ctx, [wallL(5.7, 92), wallL(7.7, 92), wallL(7.7, 28), wallL(5.7, 28)], P.woodD);
  // cielo
  const skyTop = wallL(6.7, 88).y, skyBot = wallL(6.7, 34).y;
  const sg = ctx.createLinearGradient(0, skyTop, 0, skyBot);
  sg.addColorStop(0, phase.skyTop); sg.addColorStop(1, phase.skyBot);
  quadFill(ctx, [wallL(5.82, 86), wallL(7.58, 86), wallL(7.58, 34), wallL(5.82, 34)], sg);
  if (phase.celestial === "moon") {
    // luna pixel con "morso" + stelle
    ctx.fillStyle = "#f3f0dc";
    ctx.fillRect(wallL(6.15, 74).x, wallL(6.15, 74).y, 7, 7);
    ctx.fillStyle = phase.skyTop;
    ctx.fillRect(wallL(6.15, 74).x + 4, wallL(6.15, 74).y - 1, 5, 5);
    if (phase.stars) {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (const [sc2, sh2] of [[6.0, 80], [6.6, 70], [7.1, 78], [7.35, 56], [6.3, 50], [7.45, 68]]) {
        const sp2 = wallL(sc2, sh2);
        ctx.fillRect(Math.round(sp2.x), Math.round(sp2.y), 1, 1);
      }
    }
  } else {
    // sole (basso e caldo ad alba/tramonto) + nuvola pixel
    const sunH = phase.id === "day" ? 74 : 52;
    ctx.fillStyle = phase.id === "day" ? "#fff3b8" : "#ffc46e";
    ctx.fillRect(wallL(6.1, sunH).x, wallL(6.1, sunH).y, 7, 7);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(wallL(7.0, 58).x, wallL(7.0, 58).y, 14, 4);
    ctx.fillRect(wallL(6.85, 62).x, wallL(6.85, 62).y, 8, 4);
  }
  // traversine
  quadFill(ctx, [wallL(6.66, 88), wallL(6.84, 88), wallL(6.84, 32), wallL(6.66, 32)], P.wood);
  quadFill(ctx, [wallL(5.8, 62), wallL(7.6, 62), wallL(7.6, 58), wallL(5.8, 58)], P.wood);
  // davanzale
  quadFill(ctx, [wallL(5.66, 28), wallL(7.74, 28), wallL(7.74, 24), wallL(5.66, 24)], P.woodL);

  /* — poster sulla parete di fondo — */
  quadFill(ctx, [wallR(8.8, 90), wallR(10.1, 90), wallR(10.1, 40), wallR(8.8, 40)], "#2b3050");
  quadFill(ctx, [wallR(8.88, 87), wallR(10.02, 87), wallR(10.02, 43), wallR(8.88, 43)], false, P.gold, 1.5);
  // carta stilizzata al centro
  const pc1 = wallR(9.45, 76), pc2 = wallR(9.45, 52);
  quadFill(ctx, [
    { x: pc1.x - 8, y: pc1.y + 2 }, { x: pc1.x + 8, y: pc1.y - 2 },
    { x: pc2.x + 8, y: pc2.y - 2 }, { x: pc2.x - 8, y: pc2.y + 2 },
  ], P.paper);
  const pm = wallR(9.45, 64);
  quadFill(ctx, [{ x: pm.x, y: pm.y - 7 }, { x: pm.x + 6, y: pm.y }, { x: pm.x, y: pm.y + 7 }, { x: pm.x - 6, y: pm.y }], P.gold);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(wallR(9.05, 48).x, wallR(9.05, 48).y, 18, 2);
  ctx.fillRect(wallR(9.05, 45).x, wallR(9.05, 45).y, 12, 2);

  /* — poster gaming/anime sulle pareti — */
  const posterBg = (wp, c0, c1, hT, hB, col) => {
    quadFill(ctx, [wp(c0 + 0.07, hB - 3), wp(c1 + 0.07, hB - 3), wp(c1 + 0.07, hT - 3), wp(c0 + 0.07, hT - 3)], "rgba(40,32,60,0.22)");
    quadFill(ctx, [wp(c0, hB), wp(c1, hB), wp(c1, hT), wp(c0, hT)], col);
  };
  const band = (wp, c0, c1, h1, h2, col) =>
    quadFill(ctx, [wp(c0, h1), wp(c1, h1), wp(c1, h2), wp(c0, h2)], col);

  /* A) Ebartex brand poster (parete sinistra) */
  posterBg(wallL, 1.0, 2.7, 96, 48, "#1d3160");
  quadFill(ctx, [wallL(1.0, 96), wallL(2.7, 96), wallL(2.7, 48), wallL(1.0, 48)], false, P.gold, 1.5);
  {
    const c = wallL(1.85, 72);
    
    // Disegna l'ovale blu scuro di sfondo del logo
    ctx.fillStyle = "#121e3d";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 2, 21, 12, -0.32, 0, 2 * Math.PI);
    ctx.fill();
    
    // Disegna la freccia arancione curva sotto il testo (il swoosh di ebartex)
    ctx.save();
    ctx.translate(c.x, c.y - 2);
    ctx.rotate(-0.32);
    ctx.strokeStyle = "#FF7300";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 2, 14, 0.1, Math.PI - 0.4);
    ctx.stroke();
    
    // Punta della freccia arancione
    ctx.fillStyle = "#FF7300";
    ctx.beginPath();
    ctx.moveTo(13, -1);
    ctx.lineTo(17, 3);
    ctx.lineTo(12, 5);
    ctx.fill();
    ctx.restore();
    
    // Scritta "ebartex" in carattere sans-serif moderno e pulito (1:1 con il logo reale)
    ctx.save();
    ctx.translate(c.x, c.y - 2);
    ctx.rotate(-0.32);
    ctx.scale(1, 0.82);
    
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8.5px 'Inter', 'Outfit', 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ebartex", 0, -2);
    ctx.restore();
  }

  /* B) TCG: ventaglio di carte con glow (parete sinistra, oltre la finestra) */
  posterBg(wallL, 8.2, 9.7, 92, 42, "#232847");
  quadFill(ctx, [wallL(8.28, 89), wallL(9.62, 89), wallL(9.62, 45), wallL(8.28, 45)], false, P.gold, 1);
  {
    const cpt = wallL(8.95, 68);
    const glow = ctx.createRadialGradient(cpt.x, cpt.y + 4, 2, cpt.x, cpt.y + 4, 22);
    glow.addColorStop(0, "rgba(243,199,106,0.35)"); glow.addColorStop(1, "rgba(243,199,106,0)");
    ctx.fillStyle = glow; ctx.fillRect(cpt.x - 24, cpt.y - 20, 48, 48);
    const fanCard = (dx, dy, rot, col, face) => {
      ctx.save(); ctx.translate(cpt.x + dx, cpt.y + dy); ctx.rotate(rot);
      ctx.fillStyle = "#10142a"; ctx.fillRect(-6, -8, 12, 16);
      if (face) {
        ctx.fillStyle = "#f5f0e2"; ctx.fillRect(-5, -7, 10, 14);
        ctx.fillStyle = col; ctx.fillRect(-3, -4, 6, 6);
      } else {
        ctx.fillStyle = col; ctx.fillRect(-5, -7, 10, 14);
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(-2, -2, 4, 5);
      }
      ctx.restore();
    };
    fanCard(-9, 3, -0.38, P.red, false);
    fanCard(9, 4, 0.32, "#4a7fd6", false);
    fanCard(0, 0, -0.04, "#9a6ad6", true);
    band(wallL, 8.5, 9.4, 52, 49.5, "rgba(255,255,255,0.85)");
    band(wallL, 8.65, 9.25, 47.5, 45.5, "rgba(255,255,255,0.5)");
  }

  /* C) synthwave/arcade: sole a strisce, griglia neon, invader (parete di fondo) */
  posterBg(wallR, 6.3, 8.5, 92, 40, "#161330");
  {
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    for (const [sc, sh] of [[6.55, 86], [6.8, 74], [8.25, 84], [8.1, 70]]) {
      const p = wallR(sc, sh); ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    const suns = [[7.15, 7.65, 72], [7.08, 7.72, 69], [7.05, 7.75, 66], [7.08, 7.72, 63], [7.15, 7.65, 60]];
    suns.forEach(([a, b2, hh], i) => band(wallR, a, b2, hh + 2.5, hh, i < 2 ? "#ffb05a" : "#ff5fa0"));
    band(wallR, 6.3, 8.5, 56.5, 55, "#ff5fa0");
    ctx.strokeStyle = "rgba(255,95,160,0.45)"; ctx.lineWidth = 1;
    for (const gc of [6.85, 7.4, 7.95]) {
      const a = wallR(gc, 55);
      const b2 = wallR(gc + (gc < 7.4 ? -0.25 : gc > 7.4 ? 0.25 : 0), 42);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
    }
    band(wallR, 6.3, 8.5, 50, 49.4, "rgba(255,95,160,0.35)");
    band(wallR, 6.3, 8.5, 45, 44.4, "rgba(255,95,160,0.25)");
    const INV = ["00100100", "00111100", "01111110", "11011011", "11111111", "01011010", "10000001", "01000010"];
    const ip = wallR(7.4, 89);
    ctx.fillStyle = "#7adcf2";
    INV.forEach((row, j) => {
      for (let i = 0; i < 8; i++) if (row[i] === "1") ctx.fillRect(Math.round(ip.x) - 8 + i * 2, Math.round(ip.y) + j * 2, 2, 2);
    });
  }

  /* D) mascotte kawaii (parete di fondo, vicino all'angolo) */
  if (false) {
    posterBg(wallR, 0.9, 2.3, 90, 46, "#46b8a5");
    {
      quadFill(ctx, [wallR(0.98, 87), wallR(2.22, 87), wallR(2.22, 49), wallR(0.98, 49)], false, "rgba(255,255,255,0.55)", 1);
      const m = wallR(1.6, 72);
      ctx.fillStyle = "#fdf6e8";
      ctx.fillRect(Math.round(m.x) - 5, Math.round(m.y) - 8, 10, 2);
      ctx.fillRect(Math.round(m.x) - 7, Math.round(m.y) - 6, 14, 9);
      ctx.fillRect(Math.round(m.x) - 5, Math.round(m.y) + 3, 10, 2);
      ctx.fillRect(Math.round(m.x) - 7, Math.round(m.y) - 10, 3, 3);
      ctx.fillRect(Math.round(m.x) + 4, Math.round(m.y) - 10, 3, 3);
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(Math.round(m.x) - 4, Math.round(m.y) - 3, 2, 3);
      ctx.fillRect(Math.round(m.x) + 2, Math.round(m.y) - 3, 2, 3);
      ctx.fillStyle = "#f2a0b0";
      ctx.fillRect(Math.round(m.x) - 6, Math.round(m.y), 2, 2);
      ctx.fillRect(Math.round(m.x) + 4, Math.round(m.y), 2, 2);
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) + 1, 2, 1);
      ctx.fillStyle = "#ffe9b0";
      ctx.fillRect(Math.round(m.x) + 8, Math.round(m.y) - 9, 2, 2);
      band(wallR, 1.15, 2.05, 55, 52.5, "rgba(255,255,255,0.9)");
      band(wallR, 1.3, 1.9, 50.5, 48.5, "rgba(255,255,255,0.55)");
    }
  }

  /* — battiscopa — */
  quadFill(ctx, [wallL(0, 10), wallL(ROWS, 10), wallL(ROWS, 0), wallL(0, 0)], P.baseDark);
  quadFill(ctx, [wallR(0, 10), wallR(COLS, 10), wallR(COLS, 0), wallR(0, 0)], P.base);
  quadFill(ctx, [wallL(0, 10), wallL(ROWS, 10), wallL(ROWS, 8), wallL(0, 8)], shade(P.baseDark, 1.25));
  quadFill(ctx, [wallR(0, 10), wallR(COLS, 10), wallR(COLS, 8), wallR(0, 8)], shade(P.base, 1.25));

  /* — pavimento — */
  for (let cy = 0; cy < ROWS; cy++) {
    for (let cx = 0; cx < COLS; cx++) {
      const t = tileTop(cx, cy);
      quadFill(ctx, [
        t, { x: t.x + HTW, y: t.y + HTH }, { x: t.x, y: t.y + HTH * 2 }, { x: t.x - HTW, y: t.y + HTH },
      ], (cx + cy) % 2 ? P.floorB : P.floorA);
      // fughe sui bordi bassi
      ctx.strokeStyle = "rgba(120,105,80,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(t.x + HTW, t.y + HTH); ctx.lineTo(t.x, t.y + HTH * 2); ctx.lineTo(t.x - HTW, t.y + HTH);
      ctx.stroke();
    }
  }
  /* — spessore della soletta sui bordi anteriori — */
  const bL = tileTop(0, ROWS), bB = tileTop(COLS, ROWS), bR = tileTop(COLS, 0);
  quadFill(ctx, [bL, bB, { x: bB.x, y: bB.y + 10 }, { x: bL.x, y: bL.y + 10 }], P.floorSide);
  quadFill(ctx, [bB, bR, { x: bR.x, y: bR.y + 10 }, { x: bB.x, y: bB.y + 10 }], shade(P.floorSide, 0.8));

  /* — ombreggiatura alla base delle pareti — */
  for (const [pa, pb, dx] of [[wallL(0, 0), wallL(ROWS, 0), 1], [wallR(0, 0), wallR(COLS, 0), -1]]) {
    quadFill(ctx, [pa, pb, { x: pb.x + 12 * dx, y: pb.y + 6 }, { x: pa.x + 12 * dx, y: pa.y + 6 }], "rgba(45,40,65,0.12)");
  }

  /* — tappeto — */
  const rugPts = (i) => [
    tileTop(2.6 + i, 4.6 + i), tileTop(6.4 - i, 4.6 + i),
    tileTop(6.4 - i, 7.4 - i), tileTop(2.6 + i, 7.4 - i),
  ];
  quadFill(ctx, rugPts(0).map((p) => ({ x: p.x, y: p.y + 3 })), "rgba(45,40,65,0.18)"); // ombra
  quadFill(ctx, rugPts(0), P.rug);
  quadFill(ctx, rugPts(0.22), false, P.rugL, 2);
  quadFill(ctx, rugPts(0.42), false, P.rugD, 2);
  const rc = tileTop(4.5, 6);
  quadFill(ctx, [
    { x: rc.x, y: rc.y - 10 }, { x: rc.x + 20, y: rc.y }, { x: rc.x, y: rc.y + 10 }, { x: rc.x - 20, y: rc.y },
  ], P.rugL);
  quadFill(ctx, [
    { x: rc.x, y: rc.y - 5 }, { x: rc.x + 10, y: rc.y }, { x: rc.x, y: rc.y + 5 }, { x: rc.x - 10, y: rc.y },
  ], P.rugD);

  /* — fascio di luce dalla finestra (sopra il tappeto) — */
  const A = wallL(5.9, 0), B2 = wallL(7.5, 0);
  const LEN = { x: 4.6 * HTW, y: 4.6 * HTH };
  const beam = [A, B2, { x: B2.x + LEN.x, y: B2.y + LEN.y }, { x: A.x + LEN.x, y: A.y + LEN.y }];
  const bg2 = ctx.createLinearGradient((A.x + B2.x) / 2, (A.y + B2.y) / 2, (A.x + B2.x) / 2 + LEN.x, (A.y + B2.y) / 2 + LEN.y);
  bg2.addColorStop(0, "rgba(255,246,210," + phase.beam.toFixed(3) + ")"); bg2.addColorStop(1, "rgba(255,246,210,0)");
  quadFill(ctx, beam, bg2);
  // luce sulla parete sotto la finestra
  quadFill(ctx, [wallL(5.9, 24), wallL(7.5, 24), wallL(7.5, 10), wallL(5.9, 10)], "rgba(255,246,210," + (phase.beam / 2).toFixed(3) + ")");

  /* — clipboard statistiche (parete sinistra, tra il brand poster e la finestra) — */
  if (stats) {
    // tavoletta + ombra
    quadFill(ctx, [wallL(3.37, 85), wallL(4.77, 85), wallL(4.77, 47), wallL(3.37, 47)], "rgba(40,32,60,0.22)");
    quadFill(ctx, [wallL(3.3, 88), wallL(4.7, 88), wallL(4.7, 50), wallL(3.3, 50)], P.woodD);
    quadFill(ctx, [wallL(3.4, 84), wallL(4.6, 84), wallL(4.6, 54), wallL(3.4, 54)], P.paper);
    // molletta metallica
    const cp = wallL(4.0, 88);
    ctx.fillStyle = P.metalL; ctx.fillRect(Math.round(cp.x) - 5, Math.round(cp.y), 10, 4);
    ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(cp.x) - 5, Math.round(cp.y) + 3, 10, 1);
    // contenuto (testo inclinato come il poster brand)
    const sc0 = wallL(4.0, 69);
    ctx.save();
    ctx.translate(sc0.x, sc0.y);
    ctx.rotate(-0.32);
    ctx.fillStyle = "#3c2a18";
    ctx.font = "bold 7px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("STATS", 0, -10);
    const wr = stats.giocati ? Math.round((stats.vinti / stats.giocati) * 100) : 0;
    // barre W/L
    const wW = Math.round(26 * (stats.giocati ? stats.vinti / stats.giocati : 0));
    ctx.fillStyle = "#5d9e4c"; ctx.fillRect(-13, -5, wW, 3);
    ctx.fillStyle = "#d94f46"; ctx.fillRect(-13 + wW, -5, 26 - wW, 3);
    ctx.fillStyle = "#3c2a18";
    ctx.font = "6px 'Courier New', monospace";
    ctx.fillText("W" + stats.vinti + " L" + (stats.giocati - stats.vinti), 0, 5);
    ctx.fillText("WR " + wr + "%", 0, 12);
    ctx.restore();
  }

  /* — citofono (parete di fondo, a destra del poster carta) — */
  quadFill(ctx, [wallR(10.5, 64), wallR(11.2, 64), wallR(11.2, 40), wallR(10.5, 40)], P.metal);
  quadFill(ctx, [wallR(10.55, 62), wallR(11.15, 62), wallR(11.15, 42), wallR(10.55, 42)], P.metalD);
  // griglia altoparlante
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1;
  for (const gh of [57, 54, 51]) {
    const a = wallR(10.62, gh), b3 = wallR(11.08, gh);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b3.x, b3.y); ctx.stroke();
  }
  // pulsante
  const ib = wallR(10.85, 46);
  ctx.fillStyle = P.gold; ctx.fillRect(Math.round(ib.x) - 2, Math.round(ib.y) - 2, 4, 4);

  return cv;
}

/* — arredi — */
function buildFurniture() {
  const meta = {};

  /* scrivania + PC (monitor acceso disegnato dinamicamente) */
  const desk = mkSprite(1, 3, 66, (ctx) => {
    isoBox(ctx, 0, 0, 1, 3, 20, P.wood);
    // cassetti sul fianco verso la stanza
    const R = isoVec(1, 0), B = isoVec(1, 3);
    const pt = (s, hh) => ({ x: R.x + s * (B.x - R.x), y: R.y + s * (B.y - R.y) - hh });
    for (const [s1, s2] of [[0.12, 0.44], [0.56, 0.88]]) {
      quadFill(ctx, [pt(s1, 4), pt(s2, 4), pt(s2, 16), pt(s1, 16)], shade(P.wood, 0.52));
      const m = pt((s1 + s2) / 2, 10);
      ctx.fillStyle = P.woodL; ctx.fillRect(Math.round(m.x) - 2, Math.round(m.y), 4, 2);
    }
    // monitor addossato al muro: base, collo, pannello (tutto dentro il piano)
    isoBox(ctx, 0.2, 1.5, 0.28, 0.3, 2, P.metalD, { z: 20, noEdge: true });
    isoBox(ctx, 0.28, 1.57, 0.1, 0.14, 8, P.metalD, { z: 22, noEdge: true });
    isoBox(ctx, 0.14, 1.16, 0.14, 0.98, 24, "#3a4050", { z: 30 });
    const mR = isoVec(0.28, 1.16), mB = isoVec(0.28, 2.14);
    const q = (s, hh) => ({ x: mR.x + s * (mB.x - mR.x), y: mR.y + s * (mB.y - mR.y) - hh });
    meta.screenQuad = [q(0.08, 51), q(0.92, 51), q(0.92, 33), q(0.08, 33)];
    quadFill(ctx, meta.screenQuad, "#101826"); // schermo spento (acceso nel loop)
    // tastiera davanti al monitor, verso la sedia
    isoBox(ctx, 0.58, 1.3, 0.34, 0.62, 3, "#d8d4c8", { z: 20, noEdge: true });
    ctx.fillStyle = "#8a877c";
    for (let i = 0; i < 4; i++) {
      const kp = isoVec(0.75, 1.42 + i * 0.13);
      ctx.fillRect(Math.round(kp.x) - 2, Math.round(kp.y) - 23, 4, 1);
    }
    // case PC compatto in fondo alla scrivania
    isoBox(ctx, 0.16, 2.42, 0.3, 0.46, 22, "#3a4050");
    const cB = isoVec(0.46, 2.88), cR = isoVec(0.46, 2.42);
    const cm = { x: (cB.x + cR.x) / 2, y: (cB.y + cR.y) / 2 };
    ctx.fillStyle = P.screen; ctx.fillRect(Math.round(cm.x) - 3, Math.round(cm.y) - 36, 2, 2);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(Math.round(cm.x) - 4, Math.round(cm.y) - 31, 7, 1);
    ctx.fillRect(Math.round(cm.x) - 4, Math.round(cm.y) - 28, 7, 1);
    // tazza
    isoBox(ctx, 0.62, 0.5, 0.15, 0.15, 5, P.red, { z: 20, noEdge: true });
  });

  /* telecamere su treppiede, in diagonale rispetto alla sedia:
     "sw" = vista frontale, obiettivo che punta in basso verso la postazione;
     "ne" = vista da dietro, schermino flip-out acceso e canna che spunta verso l'alto */
  const mkCam = (toward) => mkSprite(1, 1, 52, (ctx) => {
    const top = { x: isoVec(0.5, 0.5).x, y: isoVec(0.5, 0.5).y - 26 };
    ctx.strokeStyle = P.metalD; ctx.lineWidth = 2;
    for (const [fx, fy] of [[0.14, 0.22], [0.86, 0.34], [0.42, 0.92]]) {
      const f = isoVec(fx, fy);
      ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(f.x, f.y); ctx.stroke();
    }
    ctx.fillStyle = P.metal; ctx.fillRect(Math.round(top.x) - 2, Math.round(top.y) - 4, 4, 5);
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 11, "#3a4050", { z: 30 });
    const fL = isoVec(0.3, 0.7), fB = isoVec(0.7, 0.7);
    const fm = { x: (fL.x + fB.x) / 2, y: (fL.y + fB.y) / 2 - 35 };
    if (toward === "sw") {
      ctx.fillStyle = "#23283a";
      ctx.fillRect(Math.round(fm.x) - 6, Math.round(fm.y) - 1, 4, 4);
      ctx.fillStyle = "#141a26";
      ctx.beginPath(); ctx.arc(fm.x - 1, fm.y + 1, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.screenD; ctx.fillRect(Math.round(fm.x) - 2, Math.round(fm.y) - 1, 2, 2);
      meta.camLedA = { x: Math.round(fB.x) - 2, y: Math.round(fB.y) - 39 };
    } else {
      ctx.fillStyle = "#10141f";
      ctx.fillRect(Math.round(fm.x) - 4, Math.round(fm.y) - 2, 8, 6);
      ctx.fillStyle = P.screenD;
      ctx.fillRect(Math.round(fm.x) - 3, Math.round(fm.y) - 1, 6, 4);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(Math.round(fm.x) - 3, Math.round(fm.y) - 1, 2, 1);
      const fR = isoVec(0.7, 0.3);
      ctx.fillStyle = "#23283a";
      ctx.fillRect(Math.round(fR.x) - 1, Math.round(fR.y) - 40, 5, 3);
      meta.camLedB = { x: Math.round(fm.x) + 4, y: Math.round(fm.y) - 5 };
    }
  });
  const cam = mkCam("sw");
  const camB = mkCam("ne");

  /* sedia da ufficio (vista da dietro) */
  const chair = mkSprite(1, 1, 46, (ctx) => {
    const c0 = isoVec(0.5, 0.5);
    ctx.strokeStyle = P.metalD; ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 + 0.5;
      ctx.beginPath(); ctx.moveTo(c0.x, c0.y - 2);
      ctx.lineTo(c0.x + Math.cos(a) * 13, c0.y - 2 + Math.sin(a) * 6.5); ctx.stroke();
    }
    isoBox(ctx, 0.44, 0.44, 0.12, 0.12, 10, P.metalD, { z: 2, noEdge: true });
    isoBox(ctx, 0.18, 0.18, 0.64, 0.64, 6, "#3f4a6e", { z: 12 });
    isoBox(ctx, 0.68, 0.2, 0.12, 0.6, 24, "#46527a", { z: 16 });
  });

  /* tavolo da gioco con panno verde, carte e deck */
  const table = mkSprite(2, 2, 72, (ctx) => {
    isoBox(ctx, 0, 0, 2, 2, 22, P.wood, { top: P.woodL });
    const inset = (i, dy) => [
      { x: isoVec(i, i).x, y: isoVec(i, i).y - dy },
      { x: isoVec(2 - i, i).x, y: isoVec(2 - i, i).y - dy },
      { x: isoVec(2 - i, 2 - i).x, y: isoVec(2 - i, 2 - i).y - dy },
      { x: isoVec(i, 2 - i).x, y: isoVec(i, 2 - i).y - dy },
    ];
    quadFill(ctx, inset(0.16, 22), P.feltD);
    quadFill(ctx, inset(0.22, 22), P.felt);
    /* carta piatta sul panno */
    const card = (tx, ty, kind, col, lift = 0) => {
      const z = 23 + lift;
      const pts = [
        { x: isoVec(tx, ty).x, y: isoVec(tx, ty).y - z },
        { x: isoVec(tx + 0.36, ty).x, y: isoVec(tx + 0.36, ty).y - z },
        { x: isoVec(tx + 0.36, ty + 0.26).x, y: isoVec(tx + 0.36, ty + 0.26).y - z },
        { x: isoVec(tx, ty + 0.26).x, y: isoVec(tx, ty + 0.26).y - z },
      ];
      // spessore
      quadFill(ctx, [pts[3], pts[2], { x: pts[2].x, y: pts[2].y + 1.5 }, { x: pts[3].x, y: pts[3].y + 1.5 }], shade(col, 0.5));
      quadFill(ctx, pts, kind === "face" ? "#f5f0e2" : col);
      const c = { x: (pts[0].x + pts[2].x) / 2, y: (pts[0].y + pts[2].y) / 2 };
      if (kind === "back") {
        quadFill(ctx, [
          { x: c.x, y: c.y - 3 }, { x: c.x + 5, y: c.y }, { x: c.x, y: c.y + 3 }, { x: c.x - 5, y: c.y },
        ], "rgba(255,255,255,0.75)");
      } else if (kind === "face") {
        ctx.fillStyle = col; ctx.fillRect(Math.round(c.x) - 3, Math.round(c.y) - 2, 6, 4);
      }
      quadFill(ctx, pts, false, "rgba(40,30,30,0.35)", 1);
    };
    /* pile ordinate (deck) */
    const pile = (tx, ty, n, col) => {
      for (let i = 0; i < n; i++) card(tx, ty, i === n - 1 ? "back" : "edge_back", col, i * 1.6);
    };
    pile(0.42, 0.42, 5, P.red);
    pile(0.38, 1.32, 4, "#4a7fd6");
    pile(1.42, 0.46, 3, "#9a6ad6");
    card(1.12, 1.12, "face", P.red);
    card(1.5, 1.42, "back", "#4a7fd6");
    card(0.95, 0.95, "face", "#9a6ad6", 0.6);
    card(1.58, 1.0, "back", P.red);
    // dado
    isoBox(ctx, 1.1, 1.62, 0.11, 0.11, 5, "#f5f0e2", { z: 23, noEdge: true });
    const dc = isoVec(1.155, 1.675);
    ctx.fillStyle = "#333"; ctx.fillRect(Math.round(dc.x) - 1, Math.round(dc.y) - 30, 2, 2);
  });

  /* sgabello */
  const stool = mkSprite(1, 1, 26, (ctx) => {
    isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 11, P.wood, { noEdge: true });
    isoBox(ctx, 0.26, 0.26, 0.48, 0.48, 4, "#c75c54", { z: 11 });
  });

  /* pianta in vaso (3 frame per il fruscio) */
  const plant = [0, 1, 2].map((f) =>
    mkSprite(1, 1, 66, (ctx) => {
      isoBox(ctx, 0.3, 0.3, 0.4, 0.4, 12, P.pot);
      isoBox(ctx, 0.26, 0.26, 0.48, 0.48, 3, shade(P.pot, 1.18), { z: 12, noEdge: true });
      const c0 = isoVec(0.5, 0.5);
      quadFill(ctx, [
        { x: c0.x - 6, y: c0.y - 15 }, { x: c0.x + 6, y: c0.y - 15 },
        { x: c0.x + 4, y: c0.y - 12 }, { x: c0.x - 4, y: c0.y - 12 },
      ], "#4a3527");
      ctx.strokeStyle = P.leafD; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c0.x, c0.y - 14); ctx.lineTo(c0.x, c0.y - 44); ctx.stroke();
      const sway = (f - 1) * 1.5;
      const leaves = [
        [-12, -38, -0.9], [12, -40, 0.9], [-10, -48, -0.45], [10, -50, 0.45], [0, -56, 0], [-4, -30, -1.2],
      ];
      leaves.forEach(([lx, ly, rot], i) => {
        ctx.save();
        ctx.translate(c0.x + lx + (i % 2 ? sway : -sway) * 0.6, c0.y + ly + (i % 2 ? 0 : (f - 1)));
        ctx.rotate(rot + sway * 0.04);
        ctx.fillStyle = i % 2 ? P.leaf : P.leafD;
        ctx.beginPath(); ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = shade(P.leafD, 0.8); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
        ctx.restore();
      });
    })
  );

  /* lampada da terra */
  const lamp = mkSprite(1, 1, 86, (ctx) => {
    const c0 = isoVec(0.5, 0.5);
    isoBox(ctx, 0.34, 0.34, 0.32, 0.32, 4, P.metalD, { noEdge: true });
    ctx.fillStyle = P.metalD; ctx.fillRect(Math.round(c0.x) - 1, Math.round(c0.y) - 64, 2, 60);
    quadFill(ctx, [
      { x: c0.x - 10, y: c0.y - 78 }, { x: c0.x + 10, y: c0.y - 78 },
      { x: c0.x + 14, y: c0.y - 62 }, { x: c0.x - 14, y: c0.y - 62 },
    ], P.gold);
    quadFill(ctx, [
      { x: c0.x - 13, y: c0.y - 63 }, { x: c0.x + 13, y: c0.y - 63 },
      { x: c0.x + 14, y: c0.y - 61 }, { x: c0.x - 14, y: c0.y - 61 },
    ], "#fff0c0");
    meta.lampGlow = { x: c0.x, y: c0.y - 62 };
  });

  /* giradischi su mobiletto (4 frame: riflesso del vinile che ruota) */
  const turn = [0, 1, 2, 3].map((fi) =>
    mkSprite(1, 1, 46, (ctx) => {
      isoBox(ctx, 0.12, 0.12, 0.76, 0.76, 16, P.woodD, { top: P.wood });
      const c0 = isoVec(0.5, 0.5);
      // piatto + vinile
      ctx.fillStyle = "#23263c";
      ctx.beginPath(); ctx.ellipse(c0.x, c0.y - 17, 13, 6.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#14161f";
      ctx.beginPath(); ctx.ellipse(c0.x, c0.y - 18, 11, 5.5, 0, 0, Math.PI * 2); ctx.fill();
      // etichetta dorata
      ctx.fillStyle = P.gold;
      ctx.beginPath(); ctx.ellipse(c0.x, c0.y - 18, 3.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      // riflesso rotante (cambia col frame)
      const a = fi * Math.PI / 2 + 0.4;
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(c0.x, c0.y - 18, 8, 4, 0, a, a + 0.9); ctx.stroke();
      // braccio
      ctx.strokeStyle = P.metalL; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c0.x + 13, c0.y - 25); ctx.lineTo(c0.x + 5, c0.y - 19); ctx.stroke();
      ctx.fillStyle = P.metal; ctx.fillRect(Math.round(c0.x) + 12, Math.round(c0.y) - 28, 3, 5);
      // manopole
      ctx.fillStyle = P.gold;
      ctx.fillRect(Math.round(c0.x) - 13, Math.round(c0.y) - 9, 2, 2);
      ctx.fillRect(Math.round(c0.x) - 9, Math.round(c0.y) - 7, 2, 2);
    })
  );

  return { desk, cam, camB, chair, table, stool, plant, lamp, turn, meta };
}

/* — bacheca di sughero (sulla parete di fondo) — */
function buildBoard() {
  const pad = 6;
  const cv = mkCanvas(96, 116);
  const ctx = cv.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const wp = (c, h) => ({ x: (c - 3) * HTW + pad, y: (c - 3) * HTH + (98 - h) + pad });
  quadFill(ctx, [wp(3, 98), wp(5.6, 98), wp(5.6, 36), wp(3, 36)], P.woodD);
  quadFill(ctx, [wp(3, 98), wp(5.6, 98), wp(5.6, 94), wp(3, 94)], P.wood);
  quadFill(ctx, [wp(3.08, 92), wp(5.52, 92), wp(5.52, 42), wp(3.08, 42)], P.cork);
  // texture sughero
  for (let i = 0; i < 60; i++) {
    const c = 3.15 + ((i * 37) % 100) / 100 * 2.3, h = 45 + ((i * 53) % 100) / 100 * 44;
    const p = wp(c, h);
    ctx.fillStyle = i % 3 ? "rgba(130,90,50,0.25)" : "rgba(255,235,200,0.2)";
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  /* fogli pinnati */
  const sheet = (c0, h0, wc, hh, color, pin) => {
    const sh = [wp(c0 + 0.04, h0 - 2), wp(c0 + wc + 0.04, h0 - 2), wp(c0 + wc + 0.04, h0 - hh - 2), wp(c0 + 0.04, h0 - hh - 2)];
    quadFill(ctx, sh, "rgba(80,55,30,0.30)");
    quadFill(ctx, [wp(c0, h0), wp(c0 + wc, h0), wp(c0 + wc, h0 - hh), wp(c0, h0 - hh)], color);
    ctx.strokeStyle = "rgba(90,70,50,0.5)"; ctx.lineWidth = 1;
    for (let li = 1; li <= 2; li++) {
      const a = wp(c0 + 0.07, h0 - 6 - li * 5), b = wp(c0 + wc - 0.07, h0 - 6 - li * 5);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    const pp = wp(c0 + wc / 2, h0 - 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(Math.round(pp.x), Math.round(pp.y) + 1, 2, 2);
    ctx.fillStyle = pin; ctx.beginPath(); ctx.arc(pp.x + 1, pp.y, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.fillRect(Math.round(pp.x), Math.round(pp.y) - 2, 1, 1);
  };
  sheet(3.18, 88, 0.55, 20, P.paper, P.red);
  sheet(3.95, 91, 0.62, 24, P.paperY, "#4a7fd6");
  sheet(4.78, 88, 0.55, 18, P.paperP, P.gold);
  sheet(3.28, 60, 0.66, 22, P.paperY, P.leaf);
  sheet(5.05, 62, 0.42, 20, P.paper, "#4a7fd6");
  sheet(4.12, 64, 0.78, 30, P.paper, P.red);
  // mini trofeo sul foglio centrale
  const tb = wp(4.51, 48);
  ctx.fillStyle = P.gold;
  ctx.fillRect(Math.round(tb.x), Math.round(tb.y), 8, 6);
  ctx.fillRect(Math.round(tb.x) + 2, Math.round(tb.y) + 6, 4, 2);
  ctx.fillRect(Math.round(tb.x) - 1, Math.round(tb.y) + 8, 10, 2);
  ctx.fillStyle = P.goldD;
  ctx.fillRect(Math.round(tb.x) - 2, Math.round(tb.y), 2, 4);
  ctx.fillRect(Math.round(tb.x) + 8, Math.round(tb.y), 2, 4);
  const base = wallR(3, 98);
  return { cv, wx: base.x - pad, wy: base.y - pad };
}

/* — icone fluttuanti — */
function buildIcons() {
  const bang = mkCanvas(16, 22);
  {
    const c = bang.getContext("2d");
    c.fillStyle = P.outline;
    c.fillRect(4, 0, 8, 13); c.fillRect(4, 15, 8, 7);
    c.fillStyle = P.gold;
    c.fillRect(6, 2, 4, 9); c.fillRect(6, 17, 4, 3);
    c.fillStyle = "#ffe9b0"; c.fillRect(6, 2, 1, 9);
  }
  const cards = mkCanvas(26, 22);
  {
    const c = cards.getContext("2d");
    c.save(); c.translate(9, 11); c.rotate(-0.25);
    c.fillStyle = P.outline; c.fillRect(-6, -8, 12, 16);
    c.fillStyle = P.red; c.fillRect(-5, -7, 10, 14);
    c.fillStyle = "rgba(255,255,255,0.8)"; c.fillRect(-2, -3, 4, 6);
    c.restore();
    c.save(); c.translate(16, 11); c.rotate(0.22);
    c.fillStyle = P.outline; c.fillRect(-6, -8, 12, 16);
    c.fillStyle = "#f5f0e2"; c.fillRect(-5, -7, 10, 14);
    c.fillStyle = P.gold; c.fillRect(-2, -3, 4, 5);
    c.restore();
  }
  const pin = mkCanvas(18, 24);
  {
    const c = pin.getContext("2d");
    c.fillStyle = P.outline;
    c.beginPath(); c.arc(9, 8, 7, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(6, 13); c.lineTo(12, 13); c.lineTo(10, 22); c.lineTo(8, 22); c.closePath(); c.fill();
    c.fillStyle = P.red;
    c.beginPath(); c.arc(9, 8, 5.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.redD;
    c.beginPath(); c.arc(10.5, 9.5, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = P.red;
    c.beginPath(); c.arc(8.5, 7.5, 3.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffd7d0"; c.fillRect(6, 5, 2, 2);
    c.fillStyle = P.metalL; c.fillRect(8, 14, 2, 7);
  }
  return { pc: bang, decks: cards, board: pin };
}

const ICON_POS = {
  pc: { x: 196, y: 148 },
  decks: { x: 464, y: 302 },
  board: { x: 474, y: 106 },
};

/* ============================ 5. AVATAR ================================ */
/* 28x53, proporzioni habbo-like: testa grande, corpo slanciato.
   Design originale: ricci castani con meches bionde, canotta nera, catena d'oro con ciondolo "Q". */

const AV = {
  hair: "#7a5433", hairL: "#e3b266", hairD: "#583a20",
  skin: "#d69e6f", skinL: "#e9bb8d", skinD: "#b37d4f", skinXD: "#8f5e38",
  tank: "#16171e", tankL: "#2a2c39", tankD: "#0a0b10",
  pant: "#27272f", pantL: "#373741", pantD: "#1a1a21",
  shoe: "#16161c", sole: "#f2f2ea",
  gold: "#e8b13c", goldL: "#ffd96e",
  pend: "#4a8fd4", pendL: "#86c2f2", pendRim: "#71242f",
};

function drawChibi(ctx, back, fr, blink) {
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const b = fr.bodyDy || 0;

  if (!fr.sit) {
    /* — gambe — */
    px(8 + fr.aDx, 36 + fr.aDy, 6, 11, AV.pant);
    px(15 + fr.bDx, 36 + fr.bDy, 6, 11, AV.pant);
    px(8 + fr.aDx, 36 + fr.aDy, 1, 11, AV.pantL);
    px(20 + fr.bDx, 36 + fr.bDy, 1, 11, AV.pantD);
    px(8 + fr.aDx, 44 + fr.aDy, 6, 3, AV.pantD);
    px(15 + fr.bDx, 44 + fr.bDy, 6, 3, AV.pantD);
    /* — sneakers nere, suola bianca — */
    px(7 + fr.aDx, 47 + fr.aDy, 7, 3, AV.shoe);
    px(15 + fr.bDx, 47 + fr.bDy, 7, 3, AV.shoe);
    px(9 + fr.aDx, 47 + fr.aDy, 4, 1, "#ffffff");
    px(16 + fr.bDx, 47 + fr.bDy, 4, 1, "#ffffff");
    px(7 + fr.aDx, 50 + fr.aDy, 7, 2, AV.sole);
    px(15 + fr.bDx, 50 + fr.bDy, 7, 2, AV.sole);
  }

  /* — bacino — */
  px(7, 33 + b, 15, 4, AV.pant);
  px(7, 33 + b, 15, 1, AV.pantD);

  /* — braccia nude (canotta) — */
  px(4, 20 + b + fr.armA, 3, 12, back ? AV.skinD : AV.skin);
  px(22, 20 + b + fr.armB, 3, 12, AV.skinD);
  if (!back) px(4, 20 + b + fr.armA, 1, 12, AV.skinL);
  px(4, 30 + b + fr.armA, 3, 2, back ? AV.skin : AV.skinL);
  px(22, 30 + b + fr.armB, 3, 2, AV.skin);

  /* — canotta nera — */
  px(6, 20 + b, 17, 13, AV.tank);
  px(6, 20 + b, 2, 13, AV.tankL);
  px(21, 20 + b, 2, 13, AV.tankD);
  px(6, 31 + b, 17, 2, AV.tankD);
  if (!back) {
    px(11, 20 + b, 7, 2, AV.skin);   // petto scoperto tra le spalline
    px(11, 20 + b, 7, 1, AV.skinD);
  }

  /* — collo — */
  px(12, 17 + b, 5, 4, AV.skin);
  px(12, 17 + b, 5, 1, AV.skinD);

  if (!back) {
    /* — catena d'oro — */
    px(9, 21 + b, 2, 1, AV.gold); px(18, 21 + b, 2, 1, AV.gold);
    px(10, 22 + b, 2, 1, AV.goldL); px(17, 22 + b, 2, 1, AV.gold);
    px(12, 23 + b, 1, 1, AV.gold); px(16, 23 + b, 1, 1, AV.goldL);
    px(13, 24 + b, 1, 1, AV.gold); px(15, 24 + b, 1, 1, AV.gold);
    px(14, 24 + b, 1, 1, AV.goldL);
    /* — ciondolo blu con "Q" — */
    px(12, 25 + b, 5, 1, AV.pendRim);
    px(11, 26 + b, 7, 4, AV.pendRim);
    px(12, 26 + b, 5, 3, AV.pend);
    px(12, 26 + b, 1, 1, AV.pendL); px(16, 26 + b, 1, 1, AV.pendL);
    px(13, 26 + b, 3, 1, "#eef4ff");
    px(13, 27 + b, 1, 1, "#eef4ff"); px(15, 27 + b, 1, 1, "#eef4ff");
    px(13, 28 + b, 3, 1, "#eef4ff");
    px(15, 29 + b, 1, 1, "#eef4ff");
    px(12, 30 + b, 5, 1, AV.pendRim);
    px(13, 31 + b, 3, 1, AV.pendRim);
  } else {
    px(10, 20 + b, 9, 1, AV.gold);   // catena sulla nuca
  }

  /* — testa — */
  if (back) {
    px(6, 5 + b, 17, 12, AV.hair);
  } else {
    px(6, 6 + b, 17, 12, AV.skin);
    px(21, 7 + b, 2, 10, AV.skinD);   // ombra lato destro
    px(6, 7 + b, 1, 10, AV.skinL);
    px(7, 16 + b, 15, 2, AV.skinD);   // mascella
    px(10, 17 + b, 9, 1, AV.skinXD);
    /* sopracciglia folte */
    px(8, 9 + b, 5, 2, AV.hairD);
    px(16, 9 + b, 5, 2, AV.hairD);
    /* occhi */
    if (blink) {
      px(9, 12 + b, 4, 1, AV.skinXD); px(16, 12 + b, 4, 1, AV.skinXD);
    } else {
      px(9, 11 + b, 2, 2, "#ffffff"); px(11, 11 + b, 2, 2, "#171821");
      px(16, 11 + b, 2, 2, "#ffffff"); px(18, 11 + b, 2, 2, "#171821");
    }
    /* naso e bocca neutra */
    px(14, 13 + b, 1, 2, AV.skinD);
    px(11, 15 + b, 7, 1, "#8a5436");
  }

  /* — capelli ricci castani con meches bionde (sopra tutto) — */
  const knot = (kx, ky) => px(kx, ky + b, 2, 2, AV.hairD);                       // riccio in ombra
  const mech = (mx, my) => { px(mx, my + b, 2, 1, AV.hairL); px(mx + 1, my + 1 + b, 1, 1, AV.hairL); }; // ciocca bionda
  if (back) {
    px(8, 0 + b, 5, 2, AV.hair); px(15, 0 + b, 6, 2, AV.hair);
    px(5, 1 + b, 19, 5, AV.hair);
    px(4, 3 + b, 21, 10, AV.hair);
    px(3, 6 + b, 1, 4, AV.hair); px(25, 6 + b, 1, 4, AV.hair);   // ciuffi sporgenti
    px(5, 13 + b, 19, 3, AV.hair);
    px(6, 16 + b, 4, 1, AV.hair); px(12, 16 + b, 5, 1, AV.hair); px(19, 16 + b, 4, 1, AV.hair); // orlo a ciuffi
    [[10, 5], [16, 6], [7, 8], [13, 10], [19, 9], [9, 12], [15, 13]].forEach(([x, y]) => knot(x, y));
    [[7, 2], [13, 2], [18, 3], [5, 5], [11, 7], [15, 9], [6, 10], [20, 11], [10, 13], [17, 13]]
      .forEach(([x, y]) => mech(x, y));
  } else {
    px(8, 0 + b, 5, 1, AV.hair); px(15, 0 + b, 5, 1, AV.hair);   // ciuffi alti
    px(6, 1 + b, 17, 2, AV.hair);
    px(5, 2 + b, 19, 3, AV.hair);
    px(4, 4 + b, 21, 3, AV.hair);
    px(3, 5 + b, 1, 3, AV.hair); px(25, 5 + b, 1, 3, AV.hair);   // ciuffi sporgenti tondi
    px(4, 7 + b, 3, 4, AV.hair);                                  // basetta sinistra
    px(22, 7 + b, 3, 5, AV.hair);                                 // lato destro più lungo
    px(5, 7 + b, 19, 1, AV.hair);                                 // base frangia
    px(6, 8 + b, 3, 1, AV.hair); px(13, 8 + b, 3, 1, AV.hair); px(20, 8 + b, 2, 1, AV.hair); // smerli
    [[10, 2], [15, 2], [20, 4], [8, 5], [13, 6], [18, 6]].forEach(([x, y]) => knot(x, y));
    [[7, 1], [12, 1], [17, 1], [5, 3], [10, 4], [15, 4], [21, 3], [23, 7]].forEach(([x, y]) => mech(x, y));
    px(8, 7 + b, 2, 1, AV.hairL); px(16, 7 + b, 2, 1, AV.hairL); // ciocche bionde sulla frangia
  }
}

const WALK_FR = [
  { aDx: 2, aDy: 1, bDx: -1, bDy: -2, armA: 2, armB: -1, bodyDy: 0 },
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 1, armB: 0, bodyDy: -1 },
  { aDx: -1, aDy: -2, bDx: 2, bDy: 1, armA: -1, armB: 2, bodyDy: 0 },
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 0, armB: 1, bodyDy: -1 },
];
const IDLE_FR = [
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 0, armB: 0, bodyDy: 0 },
  { aDx: 0, aDy: 0, bDx: 0, bDy: 0, armA: 1, armB: 1, bodyDy: 1 },
];

function buildAvatar() {
  const make = (back, fr, blink, flip) => {
    const raw = { cv: mkCanvas(29, 54), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(29, 0); ctx.scale(-1, 1); }
    ctx.translate(0, fr.sit ? 9 : 1); // margine per il bob / abbassamento da seduto
    drawChibi(ctx, back, fr, blink);
    ctx.restore();
    const sp = outlined(raw);
    // ancora: suole in piedi, fondo del bacino da seduto (il round è al draw)
    sp.feet = fr.sit ? { x: 15.5, y: 47 } : { x: 15.5, y: 54 };
    return sp;
  };
  const dir = (back, flip) => ({
    idle: IDLE_FR.map((f) => make(back, f, false, flip)),
    walk: WALK_FR.map((f) => make(back, f, false, flip)),
    blink: make(back, IDLE_FR[0], true, flip),
  });
  return {
    se: dir(false, false), sw: dir(false, true), ne: dir(true, false), nw: dir(true, true),
    // seduto alla scrivania (di spalle, rivolto a NW)
    sit: IDLE_FR.map((f) => make(true, { ...f, sit: true }, false, true)),
  };
}

/* ====================== 5b. GATTO (pixel-art) ========================= */
/* "Missy", soriana arancione. Pose: sleep / sit / walk, in 2 frame + flip. */

function buildCat() {
  const C = { fur: "#e8a04c", dark: "#c27d2f", belly: "#f7e3c0", ear: "#a8632a", eye: "#2e2a3a", nose: "#d4716b" };
  const mk = (draw, flip) => {
    const raw = { cv: mkCanvas(26, 22), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(26, 0); ctx.scale(-1, 1); }
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    draw(px);
    ctx.restore();
    const sp = outlined(raw);
    sp.feet = { x: 13, y: 22 };
    return sp;
  };
  const walkFr = (f) => (px) => {
    // corpo orizzontale, testa a destra
    px(3, 9, 13, 7, C.fur);
    px(4, 14, 11, 2, C.belly);
    px(5, 9, 2, 6, C.dark); px(9, 9, 2, 6, C.dark); px(13, 9, 2, 6, C.dark); // strisce
    // zampe alternate
    px(4 + (f ? 1 : 0), 16, 2, 4, C.fur); px(8 - (f ? 1 : 0), 16, 2, 4, C.fur);
    px(12 + (f ? -1 : 0), 16, 2, 4, C.fur); px(15 + (f ? 1 : 0), 16, 2, 4, C.fur);
    // coda su, con punta scura
    px(1, 5 + (f ? 1 : 0), 2, 5, C.fur); px(1, 4 + (f ? 1 : 0), 2, 2, C.dark);
    // testa
    px(15, 4, 8, 7, C.fur);
    px(15, 2, 2, 3, C.ear); px(21, 2, 2, 3, C.ear);
    px(17, 6, 1, 2, C.eye); px(20, 6, 1, 2, C.eye);
    px(18, 9, 2, 1, C.nose);
  };
  const sitFr = (f) => (px) => {
    // seduto, coda che scodinzola
    px(7, 9, 10, 9, C.fur);
    px(9, 13, 6, 5, C.belly);
    px(8, 10, 2, 5, C.dark); px(13, 10, 2, 5, C.dark);
    px(8, 18, 3, 2, C.fur); px(13, 18, 3, 2, C.fur);
    // coda
    px(17 + (f ? 1 : 0), 13 - (f ? 2 : 0), 2, 6, C.fur);
    px(17 + (f ? 1 : 0), 12 - (f ? 2 : 0), 2, 2, C.dark);
    // testa
    px(8, 2, 8, 7, C.fur);
    px(8, 0, 2, 3, C.ear); px(14, 0, 2, 3, C.ear);
    px(10, 4, 1, 2, C.eye); px(13, 4, 1, 2, C.eye);
    px(11, 7, 2, 1, C.nose);
  };
  const sleepFr = (f) => (px) => {
    // gomitolo che respira
    const b = f ? 1 : 0;
    px(5, 13 - b, 15, 6 + b, C.fur);
    px(6, 11 - b, 13, 2, C.fur);
    px(7, 12 - b, 2, 3, C.dark); px(11, 11 - b, 2, 3, C.dark); px(15, 12 - b, 2, 3, C.dark);
    // testa appoggiata
    px(15, 9 - b, 7, 6, C.fur);
    px(15, 7 - b, 2, 3, C.ear); px(20, 7 - b, 2, 3, C.ear);
    px(17, 12 - b, 2, 1, C.eye); // occhi chiusi (lineetta)
    px(20, 12 - b, 1, 1, C.eye);
    // coda avvolta davanti
    px(4, 16, 12, 2, C.dark);
  };
  const pose = (fr) => [mk(fr(0), false), mk(fr(1), false), mk(fr(0), true), mk(fr(1), true)];
  return { walk: pose(walkFr), sit: pose(sitFr), sleep: pose(sleepFr) };
}

/* ============================ 6. AUDIO ================================= */

function makeAudio() {
  let ac = null, muted = false;
  const ensure = () => {
    if (muted) return null;
    if (!ac) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
    }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  const tone = ({ f = 440, f2 = 0, type = "sine", dur = 0.1, vol = 0.15, delay = 0 }) => {
    const c = ensure(); if (!c) return;
    try {
      const t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.06);
    } catch (e) { /* noop */ }
  };
  const noise = ({ dur = 0.06, freq = 800, vol = 0.1, delay = 0 }) => {
    const c = ensure(); if (!c) return;
    try {
      const n = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 1.1;
      const g = c.createGain(); g.gain.value = vol;
      const t = c.currentTime + delay;
      src.connect(bp); bp.connect(g); g.connect(c.destination);
      src.start(t);
    } catch (e) { /* noop */ }
  };
  /* — musica chiptune: sequencer 16 step con lookahead — */
  const m2f = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const MTRK = [
    { name: "Pixel Sunset", bpm: 88, type: "triangle",
      lead: [69, 0, 72, 0, 76, 0, 72, 0, 67, 0, 71, 0, 74, 0, 71, 0],
      bass: [45, 0, 0, 0, 43, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0] },
    { name: "Mana Groove", bpm: 112, type: "square",
      lead: [64, 67, 71, 67, 72, 0, 71, 67, 64, 67, 69, 67, 71, 0, 69, 67],
      bass: [40, 0, 0, 40, 38, 0, 0, 38, 36, 0, 0, 36, 38, 0, 43, 0] },
    { name: "Night Drive", bpm: 76, type: "sawtooth",
      lead: [57, 0, 60, 64, 0, 60, 0, 64, 55, 0, 59, 62, 0, 59, 0, 62],
      bass: [33, 0, 0, 0, 31, 0, 0, 0, 29, 0, 0, 0, 31, 0, 0, 0] },
  ];
  let mTimer = null, mNext = 0, mStep = 0, mIdx = -1;
  const musicStop = () => { if (mTimer) { clearInterval(mTimer); mTimer = null; } mIdx = -1; };
  const musicToggle = () => {
    if (muted) return null;
    const c = ensure(); if (!c) return null;
    mIdx++;
    if (mIdx >= MTRK.length) { musicStop(); return null; }
    if (!mTimer) {
      mNext = c.currentTime + 0.1; mStep = 0;
      mTimer = setInterval(() => {
        if (muted || !ac || mIdx < 0) return;
        const tr = MTRK[mIdx];
        const spb = 60 / tr.bpm / 4;
        while (mNext < ac.currentTime + 0.3) {
          const i = mStep % 16;
          const dl = Math.max(0, mNext - ac.currentTime);
          if (tr.lead[i]) tone({ f: m2f(tr.lead[i]), type: tr.type, dur: 0.16, vol: tr.type === "sawtooth" ? 0.022 : 0.032, delay: dl });
          if (tr.bass[i]) tone({ f: m2f(tr.bass[i]), type: "triangle", dur: 0.3, vol: 0.05, delay: dl });
          if (i % 4 === 2) noise({ dur: 0.025, freq: 6200, vol: 0.012, delay: dl });
          mNext += spb; mStep++;
        }
      }, 110);
    }
    return MTRK[mIdx].name;
  };

  return {
    ensure,
    setMuted(v) { muted = v; if (v) musicStop(); },
    musicToggle,
    musicStop,
    musicOn: () => mIdx >= 0,
    step(i) { noise({ dur: 0.05, freq: i % 2 ? 640 : 540, vol: 0.045 }); },
    click() { tone({ f: 1250, type: "square", dur: 0.045, vol: 0.06 }); },
    open() { tone({ f: 330, f2: 740, type: "triangle", dur: 0.2, vol: 0.11 }); tone({ f: 990, dur: 0.08, vol: 0.05, delay: 0.16 }); },
    close() { tone({ f: 700, f2: 300, type: "triangle", dur: 0.18, vol: 0.09 }); },
    success() { tone({ f: 659, dur: 0.09, vol: 0.11 }); tone({ f: 880, dur: 0.14, vol: 0.11, delay: 0.09 }); },
    pin() { noise({ dur: 0.05, freq: 300, vol: 0.18 }); tone({ f: 170, type: "triangle", dur: 0.07, vol: 0.16 }); },
    error() { tone({ f: 240, f2: 160, type: "square", dur: 0.12, vol: 0.07 }); },
    purr() { for (let i = 0; i < 7; i++) tone({ f: 78 + (i % 2) * 8, type: "sawtooth", dur: 0.07, vol: 0.035, delay: i * 0.07 }); },
    meow() { tone({ f: 740, f2: 990, type: "triangle", dur: 0.13, vol: 0.06 }); tone({ f: 990, f2: 600, type: "triangle", dur: 0.22, vol: 0.055, delay: 0.12 }); },
    ding() { tone({ f: 784, type: "triangle", dur: 0.4, vol: 0.12 }); tone({ f: 659, type: "triangle", dur: 0.55, vol: 0.1, delay: 0.26 }); },
    dispose() { musicStop(); try { ac && ac.close(); } catch (e) { /* noop */ } ac = null; },
  };
}

/* ========================== 7. GAME CORE =============================== */

const DEFAULT_CAM = { x: WW / 2, y: WH / 2 + 6, z: 1 };

function createGame(canvas, wrap, apiRef, dbg, opts = {}) {
  const ctx = canvas.getContext("2d");
  const stats = opts.stats || { giocati: 12, vinti: 7 };
  let phase = dayPhase();
  let bg = buildBackground(phase, stats);
  const F = buildFurniture();
  const catSp = buildCat();
  const boardSp = buildBoard();
  const icons = buildIcons();
  const avatar = buildAvatar();
  const sfx = makeAudio();
  const world = mkCanvas(WW, WH);
  const wctx = world.getContext("2d");
  wctx.imageSmoothingEnabled = false;
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* — tile bloccati e entità — */
  const blocked = new Set();
  FURN.forEach((f) => f.tiles.forEach(([x, y]) => blocked.add(tkey(x, y))));

  const sprMap = {
    desk: outlined(F.desk), cam: outlined(F.cam), cam2: outlined(F.camB), chair: outlined(F.chair),
    table: outlined(F.table), stool: outlined(F.stool), stool2: null, lamp: outlined(F.lamp),
  };
  sprMap.stool2 = sprMap.stool;
  const plantFrames = F.plant.map((p) => outlined(p));
  const turnFrames = F.turn.map((p) => outlined(p));

  const entities = FURN.map((f) => {
    const xs = f.tiles.map((t) => t[0]), ys = f.tiles.map((t) => t[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const anchor = tileTop(minX, minY);
    return {
      key: f.key, inter: f.inter || null, minX, maxX, minY, maxY, anchor,
      spr: f.key === "plant" || f.key === "turn" ? null : sprMap[f.key],
      frames: f.key === "plant" ? plantFrames : f.key === "turn" ? turnFrames : null,
    };
  });

  const inter = {};
  for (const [id, def] of Object.entries(INTERACTIVES)) inter[id] = { id, ...def };
  const rectOf = (e) => {
    const spr = e.frames ? e.frames[0] : e.spr;
    return { x: e.anchor.x - spr.ax, y: e.anchor.y - spr.ay, w: spr.cv.width, h: spr.cv.height };
  };
  inter.pc.hitRect = rectOf(entities.find((e) => e.key === "desk"));
  inter.decks.hitRect = rectOf(entities.find((e) => e.key === "table"));
  inter.board.hitRect = { x: boardSp.wx, y: boardSp.wy, w: boardSp.cv.width, h: boardSp.cv.height * 0.64 };

  const sils = {
    pc: makeSil(sprMap.desk),
    decks: makeSil(sprMap.table),
    board: makeSil({ cv: boardSp.cv }),
  };

  /* punti dinamici (in coordinate mondo) */
  const deskEnt = entities.find((e) => e.key === "desk");
  const screenQuad = F.meta.screenQuad.map((p) => ({ x: p.x + deskEnt.anchor.x, y: p.y + deskEnt.anchor.y }));
  const qlerp = (u, v) => {
    const q = screenQuad;
    const tx = lerp(q[0].x, q[1].x, u), ty = lerp(q[0].y, q[1].y, u);
    const bx = lerp(q[3].x, q[2].x, u), by = lerp(q[3].y, q[2].y, u);
    return { x: lerp(tx, bx, v), y: lerp(ty, by, v) };
  };
  const subQuad = (u1, v1, u2, v2) => [qlerp(u1, v1), qlerp(u2, v1), qlerp(u2, v2), qlerp(u1, v2)];
  const camLeds = entities.filter((e) => e.key.startsWith("cam")).map((e, i) => {
    const led = e.key === "cam" ? F.meta.camLedA : F.meta.camLedB;
    return { x: led.x + e.anchor.x, y: led.y + e.anchor.y, ph: i * 0.8 };
  });
  const lampEnt = entities.find((e) => e.key === "lamp");
  const lampGlow = { x: F.meta.lampGlow.x + lampEnt.anchor.x, y: F.meta.lampGlow.y + lampEnt.anchor.y };
  const lampFloor = { x: lampEnt.anchor.x, y: lampEnt.anchor.y + HTH + 2 };

  /* — giradischi: hit rect + silhouette per glow — */
  const turnEnt = entities.find((e) => e.key === "turn");
  const turnRect = rectOf(turnEnt);
  const turnSil = makeSil(turnFrames[0]);
  const turnTop = { x: turnEnt.anchor.x, y: turnEnt.anchor.y - 34 };

  /* — avversario fantasma: in piedi accanto al tavolo da gioco — */
  const GHOST_TILE = { cx: 9, cy: 3 };
  const ghostFrames = avatar.sw.idle;
  const ghostSils = ghostFrames.map((f) => makeSil(f, "#9fc4ff"));

  /* — tappeto: area per le orme — */
  const onRug = (cx, cy) => cx >= 3 && cx <= 6 && cy >= 5 && cy <= 7;

  /* — citofono: rettangolo cliccabile + posizione LED (parete di fondo) — */
  const rectFromPts = (pts) => {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const x0 = Math.min(...xs), y0 = Math.min(...ys);
    return { x: x0, y: y0, w: Math.max(...xs) - x0, h: Math.max(...ys) - y0 };
  };
  const intercomRect = rectFromPts([wallR(10.5, 64), wallR(11.2, 64), wallR(11.2, 40), wallR(10.5, 40)]);
  const intercomLed = wallR(11.0, 60);

  /* — easter egg: oggetti decorativi cliccabili — */
  const eggs = [
    { key: "plant", rect: rectOf(entities.find((e) => e.key === "plant")) },
    { key: "lamp", rect: rectOf(lampEnt) },
    { key: "cam", rect: rectOf(entities.find((e) => e.key === "cam")) },
    { key: "cam2", rect: rectOf(entities.find((e) => e.key === "cam2")) },
    { key: "chair", rect: rectOf(entities.find((e) => e.key === "chair")) },
    { key: "stool", rect: rectOf(entities.find((e) => e.key === "stool")) },
    { key: "stool", rect: rectOf(entities.find((e) => e.key === "stool2")) },
    { key: "window", rect: rectFromPts([wallL(7.7, 92), wallL(5.7, 92), wallL(5.7, 24), wallL(7.7, 24)]) },
    { key: "posterBrand", rect: rectFromPts([wallL(1.0, 96), wallL(2.7, 96), wallL(2.7, 48), wallL(1.0, 48)]) },
    { key: "posterTcg", rect: rectFromPts([wallL(8.2, 92), wallL(9.7, 92), wallL(9.7, 42), wallL(8.2, 42)]) },
    { key: "posterSynth", rect: rectFromPts([wallR(6.3, 92), wallR(8.5, 92), wallR(8.5, 40), wallR(6.3, 40)]) },
    { key: "stats", rect: rectFromPts([wallL(3.3, 88), wallL(4.7, 88), wallL(4.7, 50), wallL(3.3, 50)]) },
  ];

  /* — stato — */
  const st = {
    t: 0, last: 0, raf: 0, destroyed: false,
    view: { w: 1, h: 1, dpr: 1, scale: 1 },
    cam: { x: DEFAULT_CAM.x, y: DEFAULT_CAM.y, z: 1, tween: null },
    av: { from: { cx: 10, cy: 9 }, to: null, t: 0, fx: 10, fy: 9, queue: [], dir: "nw", wt: 0, stepN: 0, nextBlink: 2.6, blinkUntil: 0, seated: false },
    pending: null, lock: false, modal: null,
    sitTarget: false, standBack: null,
    nearObj: null, nearSince: 0,
    hover: { tile: null, obj: null },
    ripples: [], bubble: null, motes: [],
    flicker: { next: 1.4, until: 0 },
    lampF: { next: 2.4, until: 0 },
    introDone: false, hintHidden: false,
    keys: new Set(), lastKey: null,
    /* nuove feature */
    fx: [],                       // particelle (cuori, zzz, note, scintille)
    alert: 0,                     // glow d'allerta sul PC fino a t=alert
    ring: null,                   // { until } citofono che suona
    ringTest: null,               // timer del test citofono
    eggCd: 0,                     // cooldown easter egg
    lastAct: 0, afk: false, afkGoing: false,
    nextNote: 0, phaseCheck: 30,
    countdown: null, cdRang: false,  // sveglia torneo sul tavolo
    ghost: null,                     // username dell'avversario fantasma
    prints: [],                      // orme sul tappeto
    photoHide: false, flash: 0,      // modalità foto
    avDraw: null,                    // ultimo sprite avatar (per il riflesso)
    cat: {
      from: { cx: 4, cy: 6 }, to: null, t: 0, fx: 4, fy: 6, queue: [],
      dir: "se", state: "sleep", until: 8 + Math.random() * 6, goal: null,
      pets: 0, follow: 0, nextZ: 0,
    },
  };
  for (let i = 0; i < 14; i++) {
    st.motes.push({ u: Math.random(), v: Math.random(), sp: 0.03 + Math.random() * 0.05, ph: Math.random() * 6.28, lift: 8 + Math.random() * 48 });
  }
  // ingresso in scena
  st.av.queue = findPath({ cx: 10, cy: 9 }, { cx: 5, cy: 6 }, blocked) || [];

  /* — camera — */
  const camTo = (to, dur, cb) => {
    st.cam.tween = { fx: st.cam.x, fy: st.cam.y, fz: st.cam.z, tx: to.x, ty: to.y, tz: to.z, t: 0, dur: reduced ? dur * 0.35 : dur, cb };
  };
  const project = (wx, wy) => {
    const s = st.view.scale * st.cam.z;
    return { x: (wx - st.cam.x) * s + st.view.w / 2, y: (wy - st.cam.y) * s + st.view.h / 2 };
  };
  const unproject = (sx, sy) => {
    const s = st.view.scale * st.cam.z;
    return { x: (sx - st.view.w / 2) / s + st.cam.x, y: (sy - st.view.h / 2) / s + st.cam.y };
  };

  /* — interazioni — */
  const showBubble = (text, dur) => { st.bubble = { text, t0: st.t, dur }; };
  const hideHintOnce = () => {
    if (!st.hintHidden) { st.hintHidden = true; apiRef.current.hideHint && apiRef.current.hideHint(); }
  };

  function startInteract(o) {
    st.lock = true;
    if (o.id === "pc") st.alert = 0; // il giocatore ha visto la notifica
    const t = st.av.from;
    if (o.faceTile) {
      const dx = o.faceTile[0] - t.cx, dy = o.faceTile[1] - t.cy;
      st.av.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
    } else st.av.dir = "ne";
    const fx = lerp(o.focus.x, DEFAULT_CAM.x, 0.2), fy = lerp(o.focus.y, DEFAULT_CAM.y, 0.2);
    camTo({ x: fx, y: fy, z: o.focus.z }, 0.62, () => {
      sfx.open();
      st.modal = o.id;
      st.lock = false;
      apiRef.current.openModal && apiRef.current.openModal(o.id);
    });
  }

  function walkToTile(tl) {
    const origin = st.av.to || st.av.from;
    if (origin.cx === tl.cx && origin.cy === tl.cy) { st.av.queue = []; return false; }
    const path = findPath(origin, tl, blocked);
    if (!path) return false;
    st.av.queue = path;
    return true;
  }

  function clickObject(o) {
    sfx.click();
    st.sitTarget = false;
    const tile = st.av.to || st.av.from;
    const idle = !st.av.to && !st.av.queue.length;
    const onApproach = o.approach.some(([x, y]) => x === tile.cx && y === tile.cy);
    if (onApproach && idle) {
      if (o.id === "pc") {
        st.standBack = { cx: tile.cx, cy: tile.cy };
        st.sitTarget = true;
        st.av.queue = [{ cx: CHAIR[0], cy: CHAIR[1] }];
      } else if (o.id === "music") doMusicToggle();
      else startInteract(o);
      return;
    }
    let best = null;
    for (const [x, y] of o.approach) {
      if (tile.cx === x && tile.cy === y) { best = []; break; }
      const p = findPath(tile, { cx: x, cy: y }, blocked);
      if (p && (!best || p.length < best.length)) best = p;
    }
    if (!best) return;
    st.av.queue = best;
    st.pending = o;
    hideHintOnce();
  }

  function hitObject(sx, sy) {
    const w = unproject(sx, sy);
    for (const id of ["pc", "decks", "board"]) {
      const r = inter[id].hitRect;
      if (w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h) return inter[id];
    }
    return null;
  }

  /* — helper feature nuove — */
  const inRect = (w, r) => w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h;
  const spawnFx = (kind, x, y, n = 1) => {
    const DEF = {
      heart: { ch: "♥", col: "#ff6b8a", size: 9, rise: 26, dur: 1.3 },
      zzz: { ch: "z", col: "#cfd6f5", size: 9, rise: 22, dur: 1.8 },
      note: { ch: "♪", col: "#ffd76e", size: 10, rise: 30, dur: 1.6 },
      spark: { ch: "✦", col: "#ffe9b0", size: 9, rise: 24, dur: 1.2 },
    };
    const d = DEF[kind];
    for (let i = 0; i < n; i++) {
      st.fx.push({ ...d, x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 6, t0: st.t + i * 0.12, ph: Math.random() * 6.28 });
    }
  };

  function doMusicToggle() {
    const name = sfx.musicToggle();
    showBubble(name ? "♪ " + name : "Musica spenta 🔇", 2.6);
    if (name) spawnFx("note", turnTop.x, turnTop.y, 2);
  }

  function doRing(msg) {
    sfx.ding();
    st.ring = { until: st.t + 6 };
    st.alert = st.t + 7;
    showBubble("📯 " + msg, 5);
  }

  function hitDecor(sx, sy) {
    const w = unproject(sx, sy);
    if (inRect(w, turnRect)) return { kind: "music" };
    if (inRect(w, intercomRect)) return { kind: "intercom" };
    // gatto: cerchio attorno alla sua posizione
    const cp = tileTop(st.cat.fx, st.cat.fy);
    if (Math.abs(w.x - cp.x) < 18 && Math.abs(w.y - (cp.y + HTH - 8)) < 16) return { kind: "cat" };
    for (const eg of eggs) if (inRect(w, eg.rect)) return { kind: "egg", egg: eg };
    return null;
  }

  function petCat() {
    const cat = st.cat;
    sfx.purr();
    const cp = tileTop(cat.fx, cat.fy);
    spawnFx("heart", cp.x, cp.y - 8, 3);
    if (cat.state === "sleep") { cat.state = "sit"; cat.until = st.t + 4; }
    cat.pets++;
    if (cat.pets % 3 === 0) {
      cat.follow = 6;
      sfx.meow();
      showBubble("Missy ti segue! 🐱", 2.6);
    }
  }

  function eggClick(eg) {
    if (st.t < st.eggCd) return;
    st.eggCd = st.t + 1;
    sfx.click();
    let key = eg.key;
    if (key === "window" && phase.id === "night") key = "windowNight";
    let lines = EGG_LINES[key] || EGG_LINES.window;
    if (eg.key === "stats") {
      const wr = stats.giocati ? Math.round((stats.vinti / stats.giocati) * 100) : 0;
      lines = ["🏅 " + stats.vinti + " vittorie su " + stats.giocati + " tornei · WR " + wr + "%"];
    }
    showBubble(lines[Math.floor(Math.random() * lines.length)], 3.2);
  }

  /* — update — */
  const CHAIR = (FURN.find((f) => f.key === "chair") || { tiles: [[1, 4]] }).tiles[0];

  function shiftStep() {
    const av = st.av;
    av.seated = false; // alzandosi dalla sedia
    av.to = av.queue.shift();
    const dx = av.to.cx - av.from.cx, dy = av.to.cy - av.from.cy;
    av.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
  }

  function update(dt) {
    const av = st.av;
    // tween camera
    const tw = st.cam.tween;
    if (tw) {
      tw.t += dt;
      const k = easeInOutCubic(clamp(tw.t / tw.dur, 0, 1));
      st.cam.x = lerp(tw.fx, tw.tx, k);
      st.cam.y = lerp(tw.fy, tw.ty, k);
      st.cam.z = lerp(tw.fz, tw.tz, k);
      if (tw.t >= tw.dur) { st.cam.tween = null; st.cam.x = tw.tx; st.cam.y = tw.ty; st.cam.z = tw.tz; tw.cb && tw.cb(); }
    }
    // tastiera
    if (!av.to && !av.queue.length && !st.lock && !st.modal && st.keys.size) {
      const KMAP = {
        KeyW: [0, -1], ArrowUp: [0, -1], KeyS: [0, 1], ArrowDown: [0, 1],
        KeyA: [-1, 0], ArrowLeft: [-1, 0], KeyD: [1, 0], ArrowRight: [1, 0],
      };
      const code = st.keys.has(st.lastKey) ? st.lastKey : st.keys.values().next().value;
      const d = KMAP[code];
      if (d) {
        const nx = av.from.cx + d[0], ny = av.from.cy + d[1];
        if (inGrid(nx, ny) && !blocked.has(tkey(nx, ny))) { av.queue = [{ cx: nx, cy: ny }]; st.pending = null; st.sitTarget = false; hideHintOnce(); }
      }
    }
    // movimento
    if (!av.to && av.queue.length && !st.lock) shiftStep();
    if (av.to) {
      av.t += dt * SPEED;
      av.wt += dt * 8.5;
      if (av.t >= 1) {
        const carry = av.t - 1;
        av.from = av.to; av.to = null; av.t = 0;
        av.stepN++; sfx.step(av.stepN);
        if (onRug(av.from.cx, av.from.cy)) {
          const fp = tileTop(av.from.cx, av.from.cy);
          st.prints.push({ x: fp.x + (av.stepN % 2 ? 5 : -5), y: fp.y + HTH, t0: st.t, s: 1 });
          if (st.prints.length > 40) st.prints.shift();
        }
        if (av.queue.length && !st.lock) { shiftStep(); av.t = carry; }
        else {
          // arrivo
          if (!st.introDone) { st.introDone = true; showBubble("Benvenuto! Prova i tasti: 1 PC · 2 Tavolo · 3 Bacheca 👀", 5); }
          if (st.pending) {
            const p = st.pending; st.pending = null;
            if (p.approach.some(([x, y]) => x === av.from.cx && y === av.from.cy)) {
              if (p.id === "pc") {
                // prima di aprire il PC ci si siede sulla sedia
                st.standBack = { cx: av.from.cx, cy: av.from.cy };
                st.sitTarget = true;
                av.queue = [{ cx: CHAIR[0], cy: CHAIR[1] }];
              } else if (p.id === "music") doMusicToggle();
              else startInteract(p);
            }
          } else if (st.afkGoing) {
            // arrivato sul tappeto: inizia la meditazione
            st.afkGoing = false;
            st.afk = true;
            av.dir = "nw";
          } else if (st.sitTarget) {
            st.sitTarget = false;
            av.seated = true;
            av.dir = "nw";
            sfx.pin();
            startInteract(inter.pc);
          }
        }
      }
    } else if (!st.introDone && st.t > 3) {
      st.introDone = true; showBubble("Benvenuto! Prova i tasti: 1 PC · 2 Tavolo · 3 Bacheca 👀", 5);
    }
    const k = av.to && !av.queue.length ? easeOutQuad(av.t) : av.t;
    av.fx = av.to ? lerp(av.from.cx, av.to.cx, k) : av.from.cx;
    av.fy = av.to ? lerp(av.from.cy, av.to.cy, k) : av.from.cy;
    // blinking
    if (st.t > av.nextBlink) { av.blinkUntil = st.t + 0.13; av.nextBlink = st.t + 2.2 + Math.random() * 3; }
    // prossimità
    const t0 = av.to || av.from;
    let near = null;
    for (const o of Object.values(inter)) {
      const onAp = o.approach.some(([x, y]) => x === t0.cx && y === t0.cy);
      const nearFoot = o.footTiles.some(([x, y]) => Math.abs(x - t0.cx) <= 1 && Math.abs(y - t0.cy) <= 1);
      if (onAp || nearFoot) { near = o; break; }
    }
    if ((near && near.id) !== (st.nearObj && st.nearObj.id)) st.nearSince = st.t;
    st.nearObj = near;
    // flicker monitor
    if (st.t > st.flicker.next) { st.flicker.until = st.t + 0.12; st.flicker.next = st.t + 1.2 + Math.random() * 2.8; }
    // flicker lampada (raro e breve)
    if (st.t > st.lampF.next) { st.lampF.until = st.t + 0.05 + Math.random() * 0.12; st.lampF.next = st.t + 2.4 + Math.random() * 4.5; }
    // pulviscolo
    if (!reduced) for (const m of st.motes) { m.v += m.sp * dt * 4; if (m.v > 1) { m.v -= 1; m.u = Math.random(); } }
    // ripples
    st.ripples = st.ripples.filter((r) => st.t - r.t0 < 0.45);
    // bolla
    if (st.bubble && st.t - st.bubble.t0 > st.bubble.dur) st.bubble = null;

    /* — idle/AFK: dopo 45s di inattività si va a meditare sul tappeto — */
    if (!st.afk && !st.afkGoing && !st.modal && !st.lock && !av.seated &&
        !av.to && !av.queue.length && st.t - st.lastAct > 45 && st.introDone) {
      st.pending = null; st.sitTarget = false;
      if (walkToTile({ cx: 5, cy: 6 })) st.afkGoing = true;
      else st.afk = true; // già lì (o tile occupato): medita sul posto
    }
    if (st.afk && !reduced && Math.random() < dt * 0.8) {
      const ap = tileTop(av.fx, av.fy);
      spawnFx(Math.random() < 0.5 ? "spark" : "zzz", ap.x, ap.y - 30);
    }

    /* — test citofono programmato — */
    if (st.ringTest && st.t > st.ringTest) {
      st.ringTest = null;
      doRing("Drakmor92 ti sfida in Heads-Up! 🔥");
    }

    /* — ricontrolla la fase del giorno (ogni 30s) — */
    if (st.t > st.phaseCheck) {
      st.phaseCheck = st.t + 30;
      const ph = dayPhase();
      if (ph.id !== phase.id) { phase = ph; bg = buildBackground(phase, stats); }
    }

    /* — gatto: stati e movimento — */
    const cat = st.cat;
    if (cat.to) {
      cat.t += dt * 2.4;
      if (cat.t >= 1) {
        cat.from = cat.to; cat.to = null; cat.t = 0;
        if (onRug(cat.from.cx, cat.from.cy)) {
          const fp = tileTop(cat.from.cx, cat.from.cy);
          st.prints.push({ x: fp.x + (Math.random() < 0.5 ? 3 : -3), y: fp.y + HTH, t0: st.t, s: 0.55 });
          if (st.prints.length > 40) st.prints.shift();
        }
        if (cat.queue.length) {
          cat.to = cat.queue.shift();
          const dx = cat.to.cx - cat.from.cx, dy = cat.to.cy - cat.from.cy;
          cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
        } else {
          cat.state = cat.goal || "sit";
          cat.goal = null;
          cat.until = st.t + (cat.state === "sleep" ? 18 + Math.random() * 22 : 3 + Math.random() * 5);
        }
      }
    } else if (st.t > cat.until) {
      const catGo = (goal, target) => {
        const path = findPath(cat.from, target, blocked);
        if (path && path.length) {
          cat.queue = path;
          cat.to = cat.queue.shift();
          const dx = cat.to.cx - cat.from.cx, dy = cat.to.cy - cat.from.cy;
          cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
          cat.goal = goal;
        } else { cat.state = "sit"; cat.until = st.t + 4; }
      };
      const avT = st.av.to || st.av.from;
      const dCat = Math.abs(avT.cx - cat.from.cx) + Math.abs(avT.cy - cat.from.cy);
      if ((cat.follow > 0 || st.afk) && dCat > 1) {
        // raggiunge il giocatore (tile libero adiacente)
        let best = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = avT.cx + dx, ny = avT.cy + dy;
          if (inGrid(nx, ny) && !blocked.has(tkey(nx, ny))) { best = { cx: nx, cy: ny }; break; }
        }
        if (best) { catGo("sit", best); cat.follow = Math.max(0, cat.follow - 1); }
        else cat.until = st.t + 3;
      } else {
        const r = Math.random();
        const atHome = cat.from.cx === 4 && cat.from.cy === 6;
        if (r < 0.45) {
          if (atHome) { cat.state = "sleep"; cat.until = st.t + 18 + Math.random() * 22; }
          else catGo("sleep", { cx: 4, cy: 6 });
        } else if (r < 0.75) {
          // vaga verso un tile libero casuale
          let tgt = null;
          for (let tries = 0; tries < 8 && !tgt; tries++) {
            const nx = Math.floor(Math.random() * COLS), ny = Math.floor(Math.random() * ROWS);
            if (!blocked.has(tkey(nx, ny))) tgt = { cx: nx, cy: ny };
          }
          if (tgt) catGo("sit", tgt); else cat.until = st.t + 4;
        } else { cat.state = "sit"; cat.until = st.t + 3 + Math.random() * 5; }
      }
    }
    cat.fx = cat.to ? lerp(cat.from.cx, cat.to.cx, cat.t) : cat.from.cx;
    cat.fy = cat.to ? lerp(cat.from.cy, cat.to.cy, cat.t) : cat.from.cy;
    // zzz mentre dorme
    if (cat.state === "sleep" && !cat.to && st.t > cat.nextZ && !reduced) {
      cat.nextZ = st.t + 1.8;
      const cp = tileTop(cat.fx, cat.fy);
      spawnFx("zzz", cp.x + 6, cp.y - 6);
    }

    /* — note musicali dal giradischi — */
    if (sfx.musicOn() && st.t > st.nextNote && !reduced) {
      st.nextNote = st.t + 0.7;
      spawnFx("note", turnTop.x, turnTop.y);
    }

    /* — countdown del torneo (sveglia sul tavolo) — */
    if (st.countdown) {
      const rem = st.countdown - Date.now();
      if (rem <= 0) {
        st.countdown = null; st.cdRang = false;
        sfx.success();
        st.alert = st.t + 6;
        showBubble("🔔 Si comincia! Il torneo è LIVE!", 4);
      } else if (rem < 60000 && !st.cdRang) {
        st.cdRang = true;
        sfx.ding();
        showBubble("⏰ Il torneo inizia tra 1 minuto!", 4);
      }
    }

    /* — pulizia particelle e orme — */
    st.fx = st.fx.filter((p) => st.t - p.t0 < p.dur);
    st.prints = st.prints.filter((p) => st.t - p.t0 < 4);
  }

  /* — render — */
  const rr = (c, x, y, w, h, r) => {
    const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)); // mai negativo né oltre metà lato
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  };

  function drawGlow(sil, x, y, k = 1) {
    wctx.save();
    wctx.globalAlpha = Math.min(0.85, (0.26 + 0.16 * Math.sin(st.t * 4.2)) * k);
    wctx.globalCompositeOperation = "lighter";
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) wctx.drawImage(sil, x + ox, y + oy);
    wctx.restore();
  }

  function drawCatSprite() {
    const cat = st.cat;
    const c = tileTop(cat.fx, cat.fy);
    const cxp = c.x, cyp = c.y + HTH;
    const moving = !!cat.to;
    // ombra
    wctx.fillStyle = "rgba(25,22,40,0.22)";
    wctx.beginPath(); wctx.ellipse(cxp, cyp + 4, 9, 3.5, 0, 0, Math.PI * 2); wctx.fill();
    const flip = cat.dir === "nw" || cat.dir === "sw" ? 2 : 0;
    let fr;
    if (moving) fr = catSp.walk[flip + (Math.floor(st.t * 7) % 2)];
    else if (cat.state === "sleep") fr = catSp.sleep[flip + (Math.floor(st.t * 0.9) % 2)];
    else fr = catSp.sit[flip + (Math.floor(st.t * 1.4) % 2)];
    const bob = moving ? -Math.abs(Math.sin(cat.t * Math.PI * 2)) * 1 : 0;
    wctx.drawImage(fr.cv, Math.round(cxp - fr.feet.x), Math.round(cyp + 4 - fr.feet.y + bob));
  }

  /** contenuto acceso del monitor: 3 micro-scene a ciclo (UI, grafico, screensaver DVD) */
  const tri = (v) => Math.abs((v % 2) - 1);
  function drawMonitorScreen(flick) {
    const g = wctx.createLinearGradient(0, screenQuad[0].y, 0, screenQuad[2].y);
    g.addColorStop(0, P.screenD); g.addColorStop(1, P.glow);
    quadFill(wctx, screenQuad, g);
    const scene = Math.floor(st.t / 7) % 3;
    if (scene === 0) {
      /* dashboard a barre (originale) */
      wctx.globalAlpha = 0.4;
      quadFill(wctx, subQuad(0.06, 0.08, 0.94, 0.24), "#ffffff");
      wctx.globalAlpha = 0.35;
      quadFill(wctx, subQuad(0.1, 0.38, 0.58, 0.48), "#ffffff");
      quadFill(wctx, subQuad(0.1, 0.58, 0.72, 0.68), "#ffffff");
      if (Math.floor(st.t * 2) % 2) { wctx.globalAlpha = 0.7; quadFill(wctx, subQuad(0.76, 0.56, 0.84, 0.7), "#ffffff"); }
    } else if (scene === 1) {
      /* grafico che sale + dot lampeggiante */
      wctx.globalAlpha = 0.55;
      wctx.strokeStyle = "#eafcff"; wctx.lineWidth = 1;
      wctx.beginPath();
      const pts = [[0.08, 0.78], [0.3, 0.62], [0.5, 0.66], [0.7, 0.4], [0.9, 0.22]];
      pts.forEach(([u, v], i) => {
        const q = qlerp(u, 0.1 + v * 0.8);
        if (i) wctx.lineTo(q.x, q.y); else wctx.moveTo(q.x, q.y);
      });
      wctx.stroke();
      const last = qlerp(0.9, 0.1 + 0.22 * 0.8);
      if (Math.floor(st.t * 3) % 2) { wctx.fillStyle = "#ffffff"; wctx.fillRect(Math.round(last.x) - 1, Math.round(last.y) - 1, 3, 3); }
      wctx.globalAlpha = 0.3;
      quadFill(wctx, subQuad(0.06, 0.06, 0.5, 0.16), "#ffffff");
    } else {
      /* screensaver: logo ebartex col cuore che rimbalza stile DVD */
      const u = 0.18 + 0.62 * tri(st.t * 0.17), v = 0.2 + 0.5 * tri(st.t * 0.23);
      const q = qlerp(u, v);
      wctx.globalAlpha = 0.92;
      wctx.fillStyle = "#ffffff";
      wctx.font = "bold 6px 'Segoe UI', sans-serif";
      wctx.fillText("ebartex", Math.round(q.x) - 11, Math.round(q.y));
      wctx.strokeStyle = "#FF7300"; wctx.lineWidth = 1;
      wctx.beginPath();
      wctx.moveTo(q.x - 12, q.y + 2);
      wctx.quadraticCurveTo(q.x, q.y + 5, q.x + 11, q.y + 1);
      wctx.stroke();
      // cuoricino
      wctx.fillStyle = "#FF7300";
      wctx.fillRect(Math.round(q.x) + 12, Math.round(q.y) - 6, 2, 2);
      wctx.fillRect(Math.round(q.x) + 15, Math.round(q.y) - 6, 2, 2);
      wctx.fillRect(Math.round(q.x) + 13, Math.round(q.y) - 4, 3, 2);
      wctx.fillRect(Math.round(q.x) + 14, Math.round(q.y) - 2, 1, 1);
    }
    if (flick) { wctx.globalAlpha = 0.16; quadFill(wctx, screenQuad, "#ffffff"); }
    wctx.globalAlpha = 1;
  }

  /** sveglia-countdown sul tavolo (solo se iscritto a un torneo in attesa) */
  function drawTableClock() {
    if (!st.countdown) return;
    const rem = Math.max(0, st.countdown - Date.now());
    const c = tileTop(8, 4);
    const urgent = rem < 60000;
    const shake = urgent ? Math.round(Math.sin(st.t * 30)) : 0;
    wctx.save();
    wctx.translate(Math.round(c.x) + shake, Math.round(c.y) - 56);
    wctx.fillStyle = P.red;
    wctx.fillRect(-6, -11, 4, 3); wctx.fillRect(2, -11, 4, 3); // campanelle
    wctx.fillStyle = "#2e2a3a";
    wctx.fillRect(-15, -9, 30, 14);
    wctx.fillStyle = "#10142a";
    wctx.fillRect(-13, -7, 26, 10);
    const mm = Math.floor(rem / 60000), ss = Math.floor((rem % 60000) / 1000);
    wctx.fillStyle = urgent ? "#ff8a5c" : "#8fe0ef";
    wctx.font = "bold 8px 'Courier New', monospace";
    wctx.textAlign = "center";
    wctx.fillText(mm + ":" + String(ss).padStart(2, "0"), 0, 1);
    wctx.restore();
    wctx.textAlign = "left";
  }

  function drawAvatarSprite() {
    const av = st.av;
    const c = tileTop(av.fx, av.fy);
    const cxp = c.x, cyp = c.y + HTH;
    const moving = !!av.to;
    const seated = (av.seated || st.afk) && !moving;
    if (!seated || st.afk) {
      wctx.fillStyle = "rgba(25,22,40,0.28)";
      wctx.beginPath(); wctx.ellipse(cxp, cyp + 5, 12.5, 5, 0, 0, Math.PI * 2); wctx.fill();
    }
    let sp;
    if (seated) sp = avatar.sit[Math.floor(st.t * 1.2) % 2];
    else {
      const D = avatar[av.dir];
      if (moving) sp = D.walk[Math.floor(av.wt) % 4];
      else if (st.t < av.blinkUntil && (av.dir === "se" || av.dir === "sw")) sp = D.blink;
      else sp = D.idle[Math.floor(st.t * 1.3) % 2];
    }
    const bob = moving ? -Math.abs(Math.sin(av.t * Math.PI)) * 1.6
      : st.afk ? Math.sin(st.t * 1.6) * 1.2 : 0; // respiro lento in meditazione
    const lift = seated ? (st.afk ? 5 : 21) : 0; // sedia vs tappeto
    wctx.drawImage(sp.cv, Math.round(cxp - sp.feet.x), Math.round(cyp + 6 - sp.feet.y + bob - lift));
    st.avDraw = sp; // per il riflesso nella finestra
  }

  function drawGhostSprite() {
    const c = tileTop(GHOST_TILE.cx, GHOST_TILE.cy);
    const cxp = c.x, cyp = c.y + HTH;
    const fl = Math.sin(st.t * 2) * 1.6; // fluttua
    const idx = Math.floor(st.t * 1.2) % 2;
    const sp = ghostFrames[idx];
    const x = Math.round(cxp - sp.feet.x), y = Math.round(cyp + 2 - sp.feet.y + fl);
    wctx.fillStyle = "rgba(25,22,40,0.16)";
    wctx.beginPath(); wctx.ellipse(cxp, cyp + 5, 11, 4, 0, 0, Math.PI * 2); wctx.fill();
    wctx.globalAlpha = 0.5;
    wctx.drawImage(sp.cv, x, y);
    wctx.globalAlpha = 0.22;
    wctx.drawImage(ghostSils[idx], x, y);
    wctx.globalAlpha = 1;
    // nameplate
    wctx.font = "bold 8px 'Segoe UI', sans-serif";
    const tw = wctx.measureText(st.ghost).width;
    wctx.fillStyle = "rgba(16,18,32,0.75)";
    wctx.fillRect(Math.round(cxp - tw / 2) - 4, y - 13, Math.round(tw) + 8, 11);
    wctx.fillStyle = "#cfe0ff";
    wctx.fillText(st.ghost, Math.round(cxp - tw / 2), y - 5);
  }

  function render() {
    const { w, h, dpr, scale } = st.view;
    /* — mondo — */
    wctx.clearRect(0, 0, WW, WH);
    wctx.drawImage(bg, 0, 0);
    // orme sul tappeto (svaniscono in 4s)
    for (const pr of st.prints) {
      const k = (st.t - pr.t0) / 4;
      if (k >= 1) continue;
      wctx.globalAlpha = (1 - k) * 0.2;
      wctx.fillStyle = "#3a2a22";
      wctx.fillRect(Math.round(pr.x - 4 * pr.s), Math.round(pr.y - 2 * pr.s), Math.max(1, Math.round(3 * pr.s)), Math.max(1, Math.round(2 * pr.s)));
      wctx.fillRect(Math.round(pr.x + 1 * pr.s), Math.round(pr.y), Math.max(1, Math.round(3 * pr.s)), Math.max(1, Math.round(2 * pr.s)));
    }
    wctx.globalAlpha = 1;
    // tile evidenziato
    if (st.hover.tile && !st.modal && !st.lock) {
      const tp = tileTop(st.hover.tile.cx, st.hover.tile.cy);
      wctx.globalAlpha = 0.1 + 0.05 * Math.sin(st.t * 5);
      quadFill(wctx, [tp, { x: tp.x + HTW, y: tp.y + HTH }, { x: tp.x, y: tp.y + 2 * HTH }, { x: tp.x - HTW, y: tp.y + HTH }], "#ffffff");
      wctx.globalAlpha = 1;
      quadFill(wctx, [tp, { x: tp.x + HTW, y: tp.y + HTH }, { x: tp.x, y: tp.y + 2 * HTH }, { x: tp.x - HTW, y: tp.y + HTH }], false, "rgba(255,255,255,0.55)", 1.5);
    }
    // ripple click
    for (const r of st.ripples) {
      const kk = (st.t - r.t0) / 0.45;
      const c = tileTop(r.cx, r.cy);
      const cy2 = c.y + HTH;
      wctx.globalAlpha = (1 - kk) * 0.8;
      quadFill(wctx, [
        { x: c.x, y: cy2 - HTH * kk }, { x: c.x + HTW * kk, y: cy2 }, { x: c.x, y: cy2 + HTH * kk }, { x: c.x - HTW * kk, y: cy2 },
      ], false, "#ffffff", 2);
      wctx.globalAlpha = 1;
    }
    // bacheca (sempre dietro alle entità)
    if (st.nearObj && st.nearObj.id === "board" && !st.modal) drawGlow(sils.board, boardSp.wx, boardSp.wy);
    wctx.drawImage(boardSp.cv, boardSp.wx, boardSp.wy);
    // entità + avatar in profondità
    // da seduto l'avatar va dietro alla sedia (testa e spalle oltre lo schienale)
    const avDepthX = st.av.seated && !st.av.to ? st.av.fx - 0.31 : st.av.fx;
    const avBox = { avatar: true, minX: avDepthX - 0.01, maxX: avDepthX + 0.01, minY: st.av.fy - 0.01, maxY: st.av.fy + 0.01 };
    const catBox = { cat: true, minX: st.cat.fx - 0.01, maxX: st.cat.fx + 0.01, minY: st.cat.fy - 0.01, maxY: st.cat.fy + 0.01 };
    const dyn = [avBox, catBox];
    if (st.ghost) dyn.push({ ghost: true, minX: GHOST_TILE.cx - 0.01, maxX: GHOST_TILE.cx + 0.01, minY: GHOST_TILE.cy - 0.01, maxY: GHOST_TILE.cy + 0.01 });
    const sorted = entities.concat(dyn).sort(cmpDepth);
    const plantIdx = [0, 1, 2, 1][Math.floor(st.t * 1.4) % 4];
    const turnIdx = sfx.musicOn() ? Math.floor(st.t * 7) % 4 : 0;
    const flick = st.t < st.flicker.until;
    const pcAlert = st.alert > st.t && !st.modal;
    for (const e of sorted) {
      if (e.avatar) { drawAvatarSprite(); continue; }
      if (e.cat) { drawCatSprite(); continue; }
      if (e.ghost) { drawGhostSprite(); continue; }
      const spr = e.frames ? e.frames[e.key === "turn" ? turnIdx : plantIdx] : e.spr;
      const x = Math.round(e.anchor.x - spr.ax), y = Math.round(e.anchor.y - spr.ay);
      if (e.inter && ((st.nearObj && st.nearObj.id === e.inter) || (e.inter === "pc" && pcAlert)) && !st.modal) {
        drawGlow(sils[e.inter], x, y, e.inter === "pc" && pcAlert ? 1.9 : 1);
      }
      if (e.key === "turn" && (st.hover.decor === "music" || sfx.musicOn())) drawGlow(turnSil, x, y, sfx.musicOn() ? 0.6 : 1);
      wctx.drawImage(spr.cv, x, y);
      if (e.key === "desk") drawMonitorScreen(flick || pcAlert);
      if (e.key === "table") drawTableClock();
    }
    /* — riflesso notturno dell'avatar nella finestra — */
    if (phase.id === "night" && st.avDraw) {
      wctx.save();
      wctx.beginPath();
      const g0 = wallL(5.82, 86), g1 = wallL(7.58, 86), g2 = wallL(7.58, 34), g3 = wallL(5.82, 34);
      wctx.moveTo(g0.x, g0.y); wctx.lineTo(g1.x, g1.y); wctx.lineTo(g2.x, g2.y); wctx.lineTo(g3.x, g3.y);
      wctx.closePath(); wctx.clip();
      const rp = wallL(clamp(st.av.fy, 5.95, 7.45), 30);
      const sp = st.avDraw;
      wctx.globalAlpha = 0.16;
      wctx.translate(rp.x, rp.y);
      wctx.scale(-0.8, 0.8);
      wctx.drawImage(sp.cv, -sp.feet.x, -sp.feet.y);
      wctx.restore();
    }
    /* — tinta ambiente (giorno/notte), prima dei bagliori — */
    if (phase.amb) { wctx.fillStyle = phase.amb; wctx.fillRect(0, 0, WW, WH); }
    /* — dinamici — */
    // glow del monitor
    const sc = qlerp(0.5, 0.5);
    const mg = wctx.createRadialGradient(sc.x, sc.y, 2, sc.x, sc.y, 54);
    mg.addColorStop(0, "rgba(140,225,245," + (0.1 + (flick ? 0.07 : 0) + 0.04 * Math.sin(st.t * 3)) + ")");
    mg.addColorStop(1, "rgba(140,225,245,0)");
    wctx.save(); wctx.globalCompositeOperation = "lighter";
    wctx.fillStyle = mg; wctx.fillRect(sc.x - 56, sc.y - 56, 112, 112);
    // led telecamere (REC lampeggiante)
    for (const led of camLeds) {
      if ((st.t + led.ph) % 1.6 < 0.9) {
        wctx.fillStyle = "rgba(255,70,60,0.9)";
        wctx.fillRect(Math.round(led.x), Math.round(led.y), 2, 2);
        const lg = wctx.createRadialGradient(led.x + 1, led.y + 1, 0, led.x + 1, led.y + 1, 7);
        lg.addColorStop(0, "rgba(255,70,60,0.35)"); lg.addColorStop(1, "rgba(255,70,60,0)");
        wctx.fillStyle = lg; wctx.fillRect(led.x - 6, led.y - 6, 14, 14);
      }
    }
    // lampada: alone + cono di luce + pozza sul pavimento, con flicker occasionale
    const lf = (st.t < st.lampF.until ? 0.4 : 1) * (phase.lampBoost || 1);
    const lg2 = wctx.createRadialGradient(lampGlow.x, lampGlow.y, 2, lampGlow.x, lampGlow.y, 46);
    lg2.addColorStop(0, "rgba(255,206,120," + ((0.13 + 0.04 * Math.sin(st.t * 1.7)) * lf).toFixed(3) + ")");
    lg2.addColorStop(1, "rgba(255,206,120,0)");
    wctx.fillStyle = lg2; wctx.fillRect(lampGlow.x - 48, lampGlow.y - 48, 96, 96);
    const coneG = wctx.createLinearGradient(0, lampGlow.y, 0, lampFloor.y);
    coneG.addColorStop(0, "rgba(255,206,120," + (0.11 * lf).toFixed(3) + ")");
    coneG.addColorStop(1, "rgba(255,206,120,0.015)");
    quadFill(wctx, [
      { x: lampGlow.x - 8, y: lampGlow.y + 2 }, { x: lampGlow.x + 8, y: lampGlow.y + 2 },
      { x: lampGlow.x + 27, y: lampFloor.y }, { x: lampGlow.x - 27, y: lampFloor.y },
    ], coneG);
    const pg = wctx.createRadialGradient(lampGlow.x, lampFloor.y, 2, lampGlow.x, lampFloor.y, 32);
    pg.addColorStop(0, "rgba(255,206,120," + ((0.11 + 0.035 * Math.sin(st.t * 1.7 + 1)) * lf).toFixed(3) + ")");
    pg.addColorStop(1, "rgba(255,206,120,0)");
    wctx.fillStyle = pg;
    wctx.beginPath(); wctx.ellipse(lampGlow.x, lampFloor.y, 32, 13, 0, 0, Math.PI * 2); wctx.fill();
    wctx.restore();
    // pulviscolo nella luce
    if (!reduced) {
      const A = wallL(5.9, 0), B = wallL(7.5, 0);
      for (const m of st.motes) {
        const bx = lerp(A.x, B.x, m.u), by = lerp(A.y, B.y, m.u);
        const x = bx + m.v * 4.6 * HTW + Math.sin(st.t * 1.3 + m.ph) * 3;
        const y = by + m.v * 4.6 * HTH - m.lift;
        const a = Math.max(0, Math.sin(Math.PI * m.v)) * (0.22 + 0.18 * Math.sin(st.t * 2 + m.ph));
        if (a > 0.02) { wctx.fillStyle = "rgba(255,250,225," + a.toFixed(3) + ")"; wctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
      }
    }
    // icone fluttuanti
    for (const id of ["pc", "decks", "board"]) {
      if (st.modal === id) continue;
      const ic = icons[id], p = ICON_POS[id];
      const ph = id === "pc" ? 0 : id === "decks" ? 2.1 : 4.2;
      const alertMe = id === "pc" && st.alert > st.t;
      const bounce = Math.sin(st.t * (alertMe ? 7 : 2.6) + ph) * (alertMe ? 5 : 3);
      const nearMe = st.nearObj && st.nearObj.id === id;
      const sc2 = alertMe ? 1.45 : nearMe ? 1.2 : 1;
      const iw = ic.width * sc2, ih = ic.height * sc2;
      wctx.globalAlpha = 0.18;
      wctx.beginPath(); wctx.ellipse(p.x, p.y + 6, 5, 2, 0, 0, Math.PI * 2);
      wctx.fillStyle = "#1a1a2a"; wctx.fill();
      wctx.globalAlpha = 1;
      wctx.drawImage(ic, Math.round(p.x - iw / 2), Math.round(p.y - ih + bounce - 4), Math.round(iw), Math.round(ih));
    }

    /* — LED del citofono (verde fisso, rosso lampeggiante quando suona) — */
    {
      const ringing = st.ring && st.t < st.ring.until;
      const on = !ringing || Math.floor(st.t * 6) % 2 === 0;
      wctx.fillStyle = ringing ? (on ? "#ff5a4e" : "#5a1e1a") : "#51e3a4";
      wctx.fillRect(Math.round(intercomLed.x), Math.round(intercomLed.y), 2, 2);
      if (ringing && on) {
        const ig = wctx.createRadialGradient(intercomLed.x + 1, intercomLed.y + 1, 0, intercomLed.x + 1, intercomLed.y + 1, 9);
        ig.addColorStop(0, "rgba(255,90,78,0.5)"); ig.addColorStop(1, "rgba(255,90,78,0)");
        wctx.fillStyle = ig; wctx.fillRect(intercomLed.x - 8, intercomLed.y - 8, 18, 18);
      }
    }

    /* — particelle (cuori, zzz, note, scintille) — */
    for (const p of st.fx) {
      const age = st.t - p.t0;
      if (age < 0) continue;
      const k = age / p.dur;
      wctx.globalAlpha = Math.max(0, 1 - k);
      wctx.fillStyle = p.col;
      wctx.font = "bold " + p.size + "px 'Segoe UI', sans-serif";
      wctx.fillText(p.ch, Math.round(p.x + Math.sin((st.t + p.ph) * 3) * 3), Math.round(p.y - k * p.rise));
    }
    wctx.globalAlpha = 1;

    /* — compositing su schermo — */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = scale * st.cam.z * dpr;
    ctx.imageSmoothingEnabled = scale * st.cam.z < 1;
    ctx.setTransform(s, 0, 0, s, canvas.width / 2 - st.cam.x * s, canvas.height / 2 - st.cam.y * s);
    ctx.drawImage(world, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    /* — layer schermo: tooltip + fumetto (testo nitido) — */
    if (st.nearObj && !st.modal && !st.lock && !st.photoHide) {
      const o = st.nearObj;
      const a = clamp((st.t - st.nearSince) * 5, 0, 1);
      const r = o.hitRect;
      const pTop = project(r.x + r.w / 2, r.y + (o.id === "board" ? -2 : 6));
      ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
      const l1 = o.icon + " " + o.name;
      const l2 = o.desc + " · clicca per aprire";
      const w1 = ctx.measureText(l1).width;
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
      const w2 = ctx.measureText(l2).width;
      const bw = Math.max(w1, w2) + 22, bh = 42;
      const bx = clamp(pTop.x - bw / 2, 8, w - bw - 8);
      const by = Math.max(8, pTop.y - bh - 12);
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(18,20,36,0.92)";
      rr(ctx, bx, by, bw, bh, 9); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(clamp(pTop.x, bx + 12, bx + bw - 12) - 5, by + bh);
      ctx.lineTo(clamp(pTop.x, bx + 12, bx + bw - 12) + 5, by + bh);
      ctx.lineTo(clamp(pTop.x, bx + 12, bx + bw - 12), by + bh + 6);
      ctx.closePath(); ctx.fillStyle = "rgba(18,20,36,0.92)"; ctx.fill();
      ctx.fillStyle = "#ffe9b0";
      ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(l1, bx + 11, by + 17);
      ctx.fillStyle = "#c8d0e8";
      ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
      ctx.fillText(l2, bx + 11, by + 33);
      ctx.globalAlpha = 1;
    }
    if (st.bubble && !st.photoHide) {
      const age = st.t - st.bubble.t0;
      const pop = easeOutBack(clamp(age * 4, 0, 1));
      const fade = clamp((st.bubble.dur - age) * 2, 0, 1);
      const c = tileTop(st.av.fx, st.av.fy);
      const pt = project(c.x, c.y + HTH - 48);
      ctx.font = "600 13px 'Segoe UI', system-ui, sans-serif";
      const tw2 = ctx.measureText(st.bubble.text).width;
      const bw = (tw2 + 24) * pop, bh = 30 * pop;
      const bx = clamp(pt.x - bw / 2, 6, w - bw - 6), by = pt.y - bh - 8;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#ffffff";
      rr(ctx, bx, by, bw, bh, 10 * pop); ctx.fill();
      ctx.strokeStyle = P.outline; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pt.x - 5 * pop, by + bh - 1);
      ctx.lineTo(pt.x + 5 * pop, by + bh - 1);
      ctx.lineTo(pt.x, by + bh + 7 * pop);
      ctx.closePath(); ctx.fillStyle = "#ffffff"; ctx.fill();
      ctx.strokeStyle = P.outline; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pt.x - 5 * pop, by + bh + 1);
      ctx.lineTo(pt.x, by + bh + 7 * pop);
      ctx.moveTo(pt.x + 5 * pop, by + bh + 1);
      ctx.lineTo(pt.x, by + bh + 7 * pop);
      ctx.stroke();
      if (pop > 0.9) {
        ctx.fillStyle = "#23263c";
        ctx.font = "600 " + Math.round(13 * pop) + "px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText(st.bubble.text, bx + 12, by + bh / 2 + 5);
      }
      ctx.globalAlpha = 1;
    }
    /* — flash della foto — */
    if (st.flash && st.t - st.flash < 0.25) {
      ctx.fillStyle = "rgba(255,255,255," + (0.5 * (1 - (st.t - st.flash) / 0.25)).toFixed(3) + ")";
      ctx.fillRect(0, 0, w, h);
    }
  }

  /* — modalità foto: PNG del canvas con watermark ebartex ♥ — */
  function drawWatermark(c2, w, h) {
    const x = w - 14, y = h - 14;
    c2.save();
    c2.fillStyle = "rgba(13,17,28,0.72)";
    rr(c2, x - 124, y - 28, 124, 28, 14); c2.fill();
    c2.strokeStyle = "rgba(255,255,255,0.18)"; c2.lineWidth = 1; c2.stroke();
    // wordmark
    c2.fillStyle = "#ffffff";
    c2.font = "900 14px 'Segoe UI', system-ui, sans-serif";
    c2.textAlign = "left"; c2.textBaseline = "alphabetic";
    c2.fillText("ebartex", x - 112, y - 9);
    // swoosh arancione con punta
    c2.strokeStyle = "#FF7300"; c2.lineWidth = 2;
    c2.beginPath();
    c2.moveTo(x - 113, y - 6);
    c2.quadraticCurveTo(x - 80, y + 1, x - 52, y - 8);
    c2.stroke();
    c2.fillStyle = "#FF7300";
    c2.beginPath();
    c2.moveTo(x - 56, y - 4); c2.lineTo(x - 48, y - 11); c2.lineTo(x - 52, y - 2);
    c2.closePath(); c2.fill();
    // cuore
    c2.beginPath();
    c2.arc(x - 36, y - 17, 4, 0, Math.PI * 2);
    c2.arc(x - 29, y - 17, 4, 0, Math.PI * 2);
    c2.fill();
    c2.beginPath();
    c2.moveTo(x - 40, y - 15.5); c2.lineTo(x - 32.5, y - 6); c2.lineTo(x - 25, y - 15.5);
    c2.closePath(); c2.fill();
    c2.restore();
  }

  function takePhoto() {
    if (st.destroyed) return;
    st.photoHide = true;
    try {
      render();
      ctx.setTransform(st.view.dpr, 0, 0, st.view.dpr, 0, 0);
      drawWatermark(ctx, st.view.w, st.view.h);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "ebartex-room.png";
      a.click();
      st.flash = st.t;
      sfx.click();
      showBubble("📸 Scatto salvato!", 2.5);
    } catch (err) {
      console.error("[IsoRoomGame] foto non riuscita:", err);
    }
    st.photoHide = false;
  }

  /* — input — */
  function pointerPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - (r.left || 0), y: e.clientY - (r.top || 0) };
  }
  function wakeAfk() {
    if (!st.afk && !st.afkGoing) return;
    const wasMeditating = st.afk;
    st.afk = false; st.afkGoing = false;
    if (wasMeditating) {
      sfx.success();
      showBubble(AFK_LINES[Math.floor(Math.random() * AFK_LINES.length)], 3.5);
      const ap = tileTop(st.av.fx, st.av.fy);
      spawnFx("spark", ap.x, ap.y - 36, 4);
    }
  }

  function onPointerDown(e) {
    sfx.ensure();
    if (st.destroyed || st.modal || st.lock) return;
    st.lastAct = st.t;
    wakeAfk();
    const p = pointerPos(e);
    const obj = hitObject(p.x, p.y);
    if (obj) { clickObject(obj); return; }
    const dec = hitDecor(p.x, p.y);
    if (dec) {
      if (dec.kind === "music") { clickObject({ ...MUSIC_OBJ }); return; }
      if (dec.kind === "cat") { petCat(); return; }
      if (dec.kind === "intercom") {
        sfx.click();
        if (!st.ringTest && !(st.ring && st.t < st.ring.until)) {
          st.ringTest = st.t + 3;
          showBubble("📯 Citofono: test in corso… resta in ascolto!", 2.6);
        }
        return;
      }
      if (dec.kind === "egg") { eggClick(dec.egg); return; }
    }
    const wpt = unproject(p.x, p.y);
    const tl = worldToTile(wpt.x, wpt.y);
    if (inGrid(tl.cx, tl.cy) && !blocked.has(tkey(tl.cx, tl.cy))) {
      st.pending = null;
      st.sitTarget = false;
      if (walkToTile(tl)) {
        st.ripples.push({ cx: tl.cx, cy: tl.cy, t0: st.t });
        hideHintOnce();
      }
    }
  }
  function onPointerMove(e) {
    if (st.destroyed) return;
    const p = pointerPos(e);
    const obj = hitObject(p.x, p.y);
    st.hover.obj = obj ? obj.id : null;
    const dec = obj ? null : hitDecor(p.x, p.y);
    st.hover.decor = dec ? dec.kind : null;
    canvas.style.cursor = (obj || dec) && !st.modal && !st.lock ? "pointer" : "default";
    if (!obj) {
      const wpt = unproject(p.x, p.y);
      const tl = worldToTile(wpt.x, wpt.y);
      st.hover.tile = inGrid(tl.cx, tl.cy) && !blocked.has(tkey(tl.cx, tl.cy)) ? tl : null;
    } else st.hover.tile = null;
  }
  function onPointerLeave() { st.hover.tile = null; st.hover.obj = null; }
  function onKeyDown(e) {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || st.modal) return;
    /* P = modalità foto */
    if (e.code === "KeyP" && !st.lock) {
      e.preventDefault();
      sfx.ensure();
      st.lastAct = st.t;
      takePhoto();
      return;
    }
    /* hotkey dirette: 1 PC · 2 Tavolo · 3 Bacheca */
    if (!st.lock && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3")) {
      e.preventDefault();
      sfx.ensure();
      st.lastAct = st.t;
      wakeAfk();
      clickObject(e.code === "Digit1" ? inter.pc : e.code === "Digit2" ? inter.decks : inter.board);
      hideHintOnce();
      return;
    }
    const codes = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    if (codes.includes(e.code)) {
      e.preventDefault();
      sfx.ensure();
      st.lastAct = st.t;
      wakeAfk();
      st.keys.add(e.code);
      st.lastKey = e.code;
    }
  }
  function onKeyUp(e) { st.keys.delete(e.code); }

  /* — resize — */
  function resize() {
    const w = Math.max(1, wrap.clientWidth || 1), h = Math.max(1, wrap.clientHeight || 1);
    const dpr = Math.min((typeof window !== "undefined" && window.devicePixelRatio) || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    st.view = { w, h, dpr, scale: Math.max(0.3, Math.min(w / WW, h / WH)) * 0.97 };
  }
  let ro = null;
  if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(() => resize()); ro.observe(wrap); }
  resize();

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function loop(ts) {
    if (st.destroyed) return;
    st.raf = requestAnimationFrame(loop); // pianifica subito: un errore non uccide il loop
    const dt = st.last ? Math.min(0.05, (ts - st.last) / 1000) : 0;
    st.last = ts;
    st.t += dt;
    try {
      update(dt);
      render();
    } catch (err) {
      st.errCount = (st.errCount || 0) + 1;
      if (st.errCount <= 3) console.error("[IsoRoomGame] errore nel frame:", err);
      if (st.errCount > 240) { st.destroyed = true; cancelAnimationFrame(st.raf); }
    }
  }
  st.raf = requestAnimationFrame(loop);

  const api = {
    sfx,
    setMuted: (v) => sfx.setMuted(v),
    /* eventi diegetici dall'esterno (cambi nei tornei, sfide, ecc.) */
    notify() { if (!st.destroyed) { st.alert = st.t + 6; sfx.success(); } },
    ring(msg) { if (!st.destroyed) doRing(msg || "C'è qualcuno al citofono!"); },
    setCountdown(epochMs) { st.countdown = epochMs || null; st.cdRang = false; },
    setGhost(name) { st.ghost = name || null; },
    takePhoto,
    zoomOut() {
      if (st.destroyed) return;
      sfx.close();
      st.modal = null;
      st.lastAct = st.t;
      st.lock = true;
      camTo(DEFAULT_CAM, 0.55, () => {
        st.lock = false;
        if (st.av.seated) {
          // si alza e torna sul tile da cui era arrivato
          const back = st.standBack || { cx: CHAIR[0], cy: CHAIR[1] + 1 };
          st.standBack = null;
          st.av.queue = [back];
        }
      });
    },
    destroy() {
      st.destroyed = true;
      cancelAnimationFrame(st.raf);
      if (ro) ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      sfx.dispose();
    },
  };
  if (typeof dbg === "function") {
    dbg({
      st, inter, project, unproject,
      screenOfTile: (cx, cy) => { const c = tileTop(cx, cy); return project(c.x, c.y + HTH); },
      objScreenPoint: (id) => { const r = inter[id].hitRect; return project(r.x + r.w / 2, r.y + r.h * 0.4); },
    });
  }
  return api;
}

/* ============================== 8. CSS ================================= */

const CSS_TEXT = [
  ".irg-root{position:relative;width:100%;height:100%;min-height:420px;overflow:hidden;",
  "background:radial-gradient(1100px 650px at 50% 28%, #142347 0%, #0d111c 65%, #2e1b10 100%);",
  "font-family:'Segoe UI',system-ui,-apple-system,sans-serif;user-select:none;}",
  ".irg-canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;}",
  ".irg-chip{position:absolute;z-index:10;background:rgba(16,18,32,.74);border:1px solid rgba(255,255,255,.14);",
  "color:#ffe9b0;border-radius:10px;padding:9px 12px;font-family:'Press Start 2P','Courier New',monospace;",
  "font-size:9px;letter-spacing:.5px;backdrop-filter:blur(4px);}",
  ".irg-title{top:12px;left:172px;display:flex;align-items:center;gap:8px;}",
  ".irg-mute{position:absolute;top:12px;right:16px;z-index:50;width:32px;height:32px;border:0;",
  "border-radius:999px;background:transparent;color:rgba(255,255,255,.6);cursor:pointer;",
  "display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;",
  "transition:color .2s,background-color .2s,transform .15s ease;}",
  ".irg-mute:hover{color:#fff;background-color:rgba(255,255,255,.1);transform:scale(1.05);}",
  ".irg-mute:active{transform:scale(.95);}",
  ".irg-hint{bottom:14px;left:50%;transform:translateX(-50%);color:#cfd6f5;font-size:8px;",
  "animation:irgHintPulse 2.2s ease-in-out infinite;transition:opacity .6s ease;white-space:nowrap;}",
  ".irg-hint.irg-off{opacity:0;pointer-events:none;}",
  "@keyframes irgHintPulse{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}",
  /* — legenda tasti (sempre visibile, margine laterale vuoto) — */
  ".irg-keys{position:absolute;left:16px;top:50%;transform:translateY(-50%);z-index:10;display:flex;",
  "flex-direction:column;gap:8px;font-family:'Press Start 2P','Courier New',monospace;font-size:8px;",
  "color:#cfd6f5;user-select:none;pointer-events:none;letter-spacing:.5px;}",
  ".irg-keys>div{display:flex;align-items:center;gap:8px;background:rgba(16,18,32,.55);",
  "border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:7px 10px;backdrop-filter:blur(3px);}",
  ".irg-keys b{display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;flex:0 0 auto;",
  "background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.3);border-radius:5px;",
  "color:#ffe9b0;font-size:9px;font-weight:400;box-shadow:0 2px 0 rgba(0,0,0,.35);}",
  "@media (max-width:900px){.irg-keys{display:none;}}",
  /* — backdrop e modale — */
  ".irg-backdrop{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;",
  "background:rgba(10,12,22,.46);backdrop-filter:blur(2.5px) saturate(.92);animation:irgFade .25s ease;padding:18px;}",
  ".irg-backdrop.irg-closing{animation:irgFadeOut .16s ease forwards;}",
  "@keyframes irgFade{from{opacity:0}to{opacity:1}}",
  "@keyframes irgFadeOut{from{opacity:1}to{opacity:0}}",
  ".irg-modal{position:relative;max-height:92%;overflow:auto;overscroll-behavior:contain;border-radius:14px;",
  "animation:irgIn .3s cubic-bezier(.34,1.45,.64,1);box-shadow:0 24px 70px rgba(0,0,0,.55);}",
  ".irg-closing .irg-modal{animation:irgOut .16s ease forwards;}",
  "@keyframes irgIn{from{opacity:0;transform:scale(.9) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}",
  "@keyframes irgOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.94) translateY(8px)}}",
  ".irg-x{position:absolute;top:10px;right:10px;z-index:5;width:32px;height:32px;border:0;border-radius:9px;",
  "background:rgba(0,0,0,.3);color:#fff;font-size:15px;line-height:1;cursor:pointer;",
  "transition:transform .15s ease,background .15s ease;}",
  ".irg-x:hover{background:rgba(0,0,0,.5);transform:rotate(8deg) scale(1.08);}",
  ".irg-esc{font-size:10px;opacity:.55;margin-left:8px;font-family:'Segoe UI',sans-serif;letter-spacing:0;}",
  ".irg-mtitle{font-family:'Press Start 2P','Courier New',monospace;font-size:13px;display:flex;align-items:center;gap:10px;}",
  /* — scrollbar — */
  ".irg-modal ::-webkit-scrollbar,.irg-modal::-webkit-scrollbar{width:9px;height:9px;}",
  ".irg-modal ::-webkit-scrollbar-thumb,.irg-modal::-webkit-scrollbar-thumb{background:rgba(0,0,0,.35);border-radius:8px;}",
  /* — modale bacheca — */
  ".irg-m-board{width:560px;max-width:100%;border:11px solid #7c5331;background:",
  "radial-gradient(rgba(86,55,25,.16) 1px,transparent 1.6px) 0 0/7px 7px,#bd8c5a;",
  "box-shadow:inset 0 0 26px rgba(60,35,10,.45),0 24px 70px rgba(0,0,0,.55);padding:20px;color:#3c2a18;}",
  ".irg-m-board .irg-mtitle{color:#fdf4e0;text-shadow:2px 2px 0 rgba(60,35,10,.6);}",
  ".irg-paper{background:#fdf8ec;border-radius:3px;box-shadow:0 4px 10px rgba(50,30,10,.35);",
  "padding:14px 16px;position:relative;margin-top:18px;}",
  ".irg-paper:before{content:'';position:absolute;top:-6px;left:50%;width:12px;height:12px;border-radius:50%;",
  "background:radial-gradient(circle at 35% 30%,#ff9d94,#d94f46 55%,#8f2d27);box-shadow:0 2px 3px rgba(0,0,0,.4);}",
  ".irg-paper.irg-tilt-l{transform:rotate(-.5deg);}",
  ".irg-paper.irg-tilt-r{transform:rotate(.45deg);}",
  ".irg-field{margin-bottom:12px;}",
  ".irg-field label{display:block;font-size:10.5px;font-weight:700;letter-spacing:.8px;",
  "text-transform:uppercase;color:#8a6133;margin-bottom:4px;}",
  ".irg-input{width:100%;box-sizing:border-box;border:0;border-bottom:2px dashed #cdb088;background:transparent;",
  "padding:6px 2px;font-size:14px;color:#3c2a18;font-family:inherit;outline:none;transition:border-color .2s;}",
  ".irg-input:focus{border-bottom-color:#d94f46;border-bottom-style:solid;}",
  "select.irg-input{cursor:pointer;}",
  ".irg-grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}",
  ".irg-err{animation:irgShake .35s ease;border-bottom-color:#d94f46!important;border-bottom-style:solid!important;}",
  "@keyframes irgShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}50%{transform:translateX(4px)}75%{transform:translateX(-2px)}}",
  ".irg-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;cursor:pointer;",
  "font-family:'Press Start 2P','Courier New',monospace;font-size:10px;color:#4a2f0e;",
  "background:linear-gradient(#ffd76e,#f2b94b);padding:13px 18px;border-radius:10px;",
  "box-shadow:0 4px 0 #9c6b1d,0 6px 14px rgba(0,0,0,.25);transition:transform .12s ease,box-shadow .12s ease,filter .15s;}",
  ".irg-btn:hover{filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 5px 0 #9c6b1d,0 8px 16px rgba(0,0,0,.28);}",
  ".irg-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #9c6b1d;}",
  ".irg-btn.irg-wide{width:100%;}",
  ".irg-pinwrap{display:flex;flex-direction:column;align-items:center;padding:26px 8px 10px;}",
  ".irg-pinned{background:#fdf8ec;border-radius:3px;box-shadow:0 6px 16px rgba(50,30,10,.4);padding:16px 20px;",
  "position:relative;transform-origin:50% 0;animation:irgPinDrop .55s cubic-bezier(.34,1.5,.64,1);max-width:330px;}",
  ".irg-pinned:before{content:'';position:absolute;top:-7px;left:50%;width:14px;height:14px;border-radius:50%;",
  "background:radial-gradient(circle at 35% 30%,#9ddc8f,#4e9e3f 55%,#2f6a26);box-shadow:0 2px 3px rgba(0,0,0,.4);",
  "animation:irgPinPop .3s .25s cubic-bezier(.34,2,.64,1) backwards;}",
  "@keyframes irgPinDrop{0%{opacity:0;transform:translateY(-46px) rotate(-4deg) scale(1.05)}",
  "60%{opacity:1;transform:translateY(2px) rotate(1.2deg)}100%{transform:translateY(0) rotate(-.6deg)}}",
  "@keyframes irgPinPop{from{transform:scale(0)}to{transform:scale(1)}}",
  ".irg-ok{font-family:'Press Start 2P',monospace;font-size:11px;color:#3f7d2f;margin:16px 0 4px;text-align:center;",
  "animation:irgPop .4s .3s cubic-bezier(.34,1.8,.64,1) backwards;}",
  "@keyframes irgPop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}",
  /* — modale deck (glass blu/oro, fantasy leggero) — */
  ".irg-m-decks{width:680px;max-width:100%;color:#eef2ff;padding:20px 18px;border-radius:18px;",
  "background:linear-gradient(180deg, rgba(61, 101, 198, 0.45) 0%, rgba(29, 49, 96, 0.55) 100%);",
  "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);",
  "box-shadow:inset 0 0 44px rgba(15,20,55,.6),inset 0 0 0 1px rgba(255,255,255,.15),0 24px 70px rgba(0,0,0,.55);}",
  ".irg-tabs{display:flex;gap:8px;margin:16px 0 12px;flex-wrap:wrap;}",
  ".irg-tab{border:0;cursor:pointer;font-size:11.5px;font-weight:800;letter-spacing:.4px;",
  "color:rgba(255,255,255,.72);background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);",
  "padding:8px 16px;border-radius:999px;transition:all .15s ease;}",
  ".irg-tab:hover{background:rgba(255,255,255,.14);color:#fff;transform:translateY(-1px);}",
  ".irg-tab.irg-on{background:rgba(243,199,106,.16);color:#F3C76A;box-shadow:inset 0 0 0 1px rgba(243,199,106,.45);}",
  ".irg-panel{background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);",
  "border-radius:18px;padding:14px;min-height:300px;max-height:min(480px,58vh);overflow:auto;}",
  ".irg-gem{width:10px;height:10px;border-radius:2.5px;transform:rotate(45deg);display:inline-block;flex:0 0 auto;",
  "box-shadow:0 0 8px rgba(255,255,255,.2),inset 0 0 0 1.5px rgba(255,255,255,.35);}",
  ".irg-deckgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:10px;}",
  ".irg-deck{position:relative;border-radius:14px;background:rgba(255,255,255,.07);cursor:pointer;",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.13);padding:12px 13px 11px;overflow:hidden;",
  "transition:transform .16s ease,box-shadow .16s ease,background .16s;}",
  ".irg-deck:before{content:'';position:absolute;inset:0 0 auto 0;height:3px;background:var(--dc,#9aa3ad);opacity:.9;}",
  ".irg-deck:hover{transform:translateY(-3px);background:rgba(255,255,255,.1);",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 10px 22px rgba(0,0,0,.35);}",
  ".irg-deck.irg-new{animation:irgPop .45s cubic-bezier(.34,1.8,.64,1);}",
  ".irg-deckname{font-weight:800;font-size:13.5px;display:flex;align-items:center;gap:8px;line-height:1.25;}",
  ".irg-deckmeta{margin-top:9px;font-size:11px;color:rgba(255,255,255,.65);",
  "display:flex;justify-content:space-between;align-items:center;}",
  ".irg-deckok{font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;}",
  ".irg-deckok.si{background:rgba(52,211,153,.14);color:#5fe3b3;box-shadow:inset 0 0 0 1px rgba(52,211,153,.35);}",
  ".irg-deckok.no{background:rgba(255,255,255,.08);color:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);}",
  ".irg-poprow{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.06);border-radius:13px;",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);padding:10px 13px;margin-bottom:8px;transition:background .15s,transform .15s;}",
  ".irg-poprow:hover{background:rgba(255,255,255,.1);transform:translateX(3px);}",
  ".irg-rank{font-size:13px;font-weight:900;color:#F3C76A;width:30px;text-align:center;flex:0 0 auto;}",
  ".irg-popname{font-weight:800;font-size:13px;display:flex;align-items:center;gap:8px;}",
  ".irg-popauth{font-size:11px;color:rgba(255,255,255,.55);margin-top:1px;}",
  ".irg-bar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:6px;}",
  ".irg-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#F3C76A,#FF7300);}",
  ".irg-wr{font-size:11px;font-weight:800;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.08);",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);color:#eef2ff;white-space:nowrap;flex:0 0 auto;}",
  ".irg-cardgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;}",
  ".irg-card{border-radius:13px;padding:8px;position:relative;background:rgba(255,255,255,.06);",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);cursor:pointer;transition:transform .16s ease,box-shadow .16s ease;}",
  ".irg-card:hover{transform:translateY(-4px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22),0 10px 20px rgba(0,0,0,.4);z-index:2;}",
  ".irg-cardart{height:58px;border-radius:9px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}",
  ".irg-cost{position:absolute;top:5px;left:5px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;",
  "background:rgba(10,6,24,.7);color:#F3C76A;font-size:10.5px;font-weight:900;",
  "display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(243,199,106,.4);}",
  ".irg-cardname{font-size:11.5px;font-weight:700;line-height:1.25;margin-top:7px;min-height:28px;}",
  ".irg-rar{display:flex;align-items:center;gap:6px;font-size:9.5px;margin-top:5px;letter-spacing:.4px;",
  "text-transform:uppercase;font-weight:700;}",
  ".irg-rar .irg-gem{width:7px;height:7px;}",
  ".irg-card.irg-r-leggendaria .irg-cardart:after{content:'';position:absolute;inset:0;",
  "background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.35) 48%,transparent 62%);",
  "background-size:240% 100%;animation:irgSheen 2.6s ease-in-out infinite;}",
  "@keyframes irgSheen{0%{background-position:130% 0}55%,100%{background-position:-60% 0}}",
  /* — modale PC/CRT — */
  ".irg-m-pc{width:900px;max-width:100%;background:rgba(35,38,47,0.45);border-radius:18px;padding:16px 16px 24px;",
  "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.12);",
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.15),0 24px 70px rgba(0,0,0,.6);}",
  ".irg-m-pc .irg-brand{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);",
  "font-family:'Press Start 2P',monospace;font-size:7px;color:#8c94a0;letter-spacing:2px;}",
  ".irg-m-pc .irg-led{position:absolute;bottom:9px;right:18px;width:7px;height:7px;border-radius:50%;",
  "background:#51e3a4;box-shadow:0 0 7px #51e3a4;animation:irgLed 2.4s ease-in-out infinite;}",
  "@keyframes irgLed{0%,100%{opacity:1}50%{opacity:.45}}",
  ".irg-screen{position:relative;border-radius:10px;border:2px solid #0a0a16;overflow:hidden;",
  "background:linear-gradient(180deg,#3d65c6 0%,#1d3160 100%);",
  "box-shadow:inset 0 0 44px rgba(15,20,55,.6);}",
  ".irg-screen:after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:8px;z-index:50;",
  "background:repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px);",
  "animation:irgCrt 9s linear infinite;}",
  "@keyframes irgCrt{0%,100%{opacity:.85}50%{opacity:1}}",
  ".irg-pcwrap{padding:18px 16px 16px;}",
  ".irg-ebx-h1{font-size:21px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#fff;",
  "text-shadow:0 2px 8px rgba(0,0,0,.45);}",
  ".irg-ebx-h1 b{color:#FF7300;}",
  ".irg-ebx-sub{margin-top:3px;font-size:12px;color:rgba(255,255,255,.6);}",
  ".irg-ebx-sub b{color:#F3C76A;}",
  ".irg-glass{margin-top:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);",
  "border-radius:22px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.1),0 20px 50px -20px rgba(0,0,0,.55);}",
  ".irg-tablewrap{max-height:min(700px,75vh);overflow:auto;border-radius:22px;}",
  ".irg-ebx-table{width:100%;min-width:620px;border-collapse:collapse;text-align:left;color:#fff;font-size:13px;}",
  ".irg-ebx-table th{position:sticky;top:0;z-index:2;background:rgba(29,49,96,.94);",
  "font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#F3C76A;",
  "padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.15);}",
  ".irg-ebx-table td{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,.06);vertical-align:middle;}",
  ".irg-ebx-table tbody tr{transition:background .15s;}",
  ".irg-ebx-table tbody tr:hover{background:rgba(255,255,255,.06);}",
  ".irg-ebx-table tbody tr:last-child td{border-bottom:0;}",
  ".irg-buyin{color:#F3C76A;font-weight:700;text-transform:uppercase;letter-spacing:.6px;font-size:12.5px;}",
  ".irg-forma{font-size:17px;font-weight:700;color:rgba(255,255,255,.9);}",
  ".irg-regnum{font-size:17px;font-weight:700;color:rgba(255,255,255,.9);font-variant-numeric:tabular-nums;}",
  ".irg-sb{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;",
  "font-size:11px;font-weight:800;white-space:nowrap;}",
  ".irg-sb.reg{background:rgba(243,199,106,.15);color:#F3C76A;box-shadow:inset 0 0 0 1px rgba(243,199,106,.3);}",
  ".irg-sb.live{background:rgba(239,68,68,.15);color:#fca5a5;box-shadow:inset 0 0 0 1px rgba(248,113,113,.3);}",
  ".irg-sb.end{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);box-shadow:inset 0 0 0 1px rgba(255,255,255,.15);}",
  ".irg-dot{width:6px;height:6px;border-radius:50%;background:currentColor;animation:irgPulseDot 1.6s ease-in-out infinite;}",
  ".irg-pulse{animation:irgPulseDot 1.6s ease-in-out infinite;}",
  "@keyframes irgPulseDot{0%,100%{opacity:1}50%{opacity:.35}}",
  ".irg-tip{position:relative;display:inline-flex;align-items:center;}",
  ".irg-tip>.irg-pop{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);",
  "display:none;z-index:40;flex-direction:column;align-items:center;}",
  ".irg-tip:hover>.irg-pop{display:flex;animation:irgPopIn .16s ease;}",
  "@keyframes irgPopIn{from{opacity:0;transform:translateX(-50%) translateY(-4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}",
  ".irg-poparrow{width:8px;height:8px;background:rgba(4,8,22,.96);border-left:1px solid rgba(255,255,255,.2);",
  "border-top:1px solid rgba(255,255,255,.2);transform:rotate(45deg);margin-bottom:-4px;}",
  ".irg-popcard{background:rgba(4,8,22,.96);border:1px solid rgba(255,255,255,.2);border-radius:14px;",
  "box-shadow:0 18px 40px rgba(0,0,0,.5);padding:10px;width:190px;text-align:left;font-size:11px;color:#fff;}",
  ".irg-popmini{width:auto;padding:5px 10px;border-radius:9px;font-size:10px;font-weight:700;white-space:nowrap;}",
  ".irg-eye{color:rgba(255,255,255,.7);cursor:pointer;display:inline-flex;transition:color .15s;}",
  ".irg-tip:hover .irg-eye{color:#fff;}",
  ".irg-plist{display:flex;flex-wrap:wrap;gap:7px;align-items:center;list-style:none;margin:0;padding:0;}",
  ".irg-ppill{position:relative;display:inline-flex;align-items:center;border-radius:999px;background:rgba(255,255,255,.1);",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.15);padding:3px 10px;font-size:11px;font-weight:600;",
  "color:rgba(255,255,255,.85);cursor:help;}",
  ".irg-pchead{display:flex;justify-content:space-between;align-items:center;gap:6px;",
  "border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:5px;margin-bottom:5px;font-weight:800;font-size:11px;}",
  ".irg-flagchip{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.1);",
  "padding:2px 6px;border-radius:6px;font-size:10px;font-weight:800;color:rgba(255,255,255,.8);}",
  ".irg-pcrow{display:flex;justify-content:space-between;color:rgba(255,255,255,.7);font-size:10px;margin-top:3px;}",
  ".irg-pcrow b{color:#fff;}",
  ".irg-pcrow .irg-on{color:#34d399;}",
  ".irg-pclab{display:block;margin-top:7px;padding-top:5px;border-top:1px solid rgba(255,255,255,.08);",
  "font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);}",
  ".irg-pcdeck{display:block;margin-top:2px;font-size:11.5px;font-weight:800;color:#F3C76A;}",
  ".irg-ebx-join{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 13px;",
  "font-size:11px;font-weight:800;color:#fff;cursor:pointer;",
  "background:linear-gradient(135deg,rgba(255,115,0,.42),rgba(255,115,0,.16));",
  "border:1.5px solid rgba(255,115,0,.6);",
  "box-shadow:inset 0 1px 1.5px rgba(255,255,255,.35),0 4px 12px rgba(0,0,0,.25),0 0 10px rgba(255,115,0,.25);",
  "transition:all .15s ease;}",
  ".irg-ebx-join:hover{background:linear-gradient(135deg,rgba(255,115,0,.55),rgba(255,115,0,.25));",
  "box-shadow:inset 0 1px 2px rgba(255,255,255,.45),0 8px 20px rgba(0,0,0,.35),0 0 18px rgba(255,115,0,.55);",
  "transform:translateY(-2px) scale(1.02);}",
  ".irg-ebx-join:active{transform:translateY(0) scale(.98);}",
  ".irg-ebx-empty{padding:44px 20px;text-align:center;}",
  ".irg-ebx-empty p{margin:0;font-size:17px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.8);}",
  ".irg-ebx-empty span{display:block;margin-top:6px;font-size:12px;color:rgba(255,255,255,.55);}",
  ".irg-mut{color:rgba(255,255,255,.35);}",
  /* — responsive — */
  "@media (max-width:600px){",
  ".irg-grid2{grid-template-columns:1fr;}",
  ".irg-m-decks{padding:12px;}",
  ".irg-hide-sm{display:none;}",
  ".irg-ebx-table{font-size:12px;}",
  ".irg-mtitle{font-size:11px;}",
  "}",
].join("\n");

let cssRefs = 0;
function injectCss() {
  cssRefs++;
  if (typeof document === "undefined") return;
  if (!document.getElementById("irg-css")) {
    const s = document.createElement("style");
    s.id = "irg-css";
    s.textContent = CSS_TEXT;
    document.head.appendChild(s);
  }
  if (!document.getElementById("irg-font")) {
    const l = document.createElement("link");
    l.id = "irg-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
    document.head.appendChild(l);
  }
}
function removeCss() {
  cssRefs--;
  if (cssRefs <= 0 && typeof document !== "undefined") {
    cssRefs = 0;
    const s = document.getElementById("irg-css");
    const f = document.getElementById("irg-font");
    if (s) s.remove();
    if (f) f.remove();
  }
}

/* =========================== 9. MODALI ================================= */

/** mini-illustrazione procedurale (SVG) per carte e deck */
function Sigil({ type, color = "rgba(255,255,255,0.92)", size = 26 }) {
  const common = { width: size, height: size, viewBox: "0 0 28 28", "aria-hidden": true };
  switch (type) {
    case "flame":
      return (
        <svg {...common}>
          <path d="M14 2 C18 8 21 11 21 17 A7 7 0 1 1 7 17 C7 11 10 8 14 2 Z" fill={color} />
          <path d="M14 11 C16 14 17.5 15.5 17.5 18.5 A3.5 3.5 0 1 1 10.5 18.5 C10.5 15.5 12 14 14 11 Z" fill="rgba(0,0,0,0.25)" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 11 Q8 5 14 10 T26 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <path d="M2 19 Q8 13 14 18 T26 17" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M14 2 C22 6 24 16 14 26 C4 16 6 6 14 2 Z" fill={color} />
          <path d="M14 5 L14 23" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <polygon points="16,1 6,16 12.5,16 10,27 22,11 15,11" fill={color} />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="6" fill={color} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1={14 + Math.cos((a * Math.PI) / 180) * 9} y1={14 + Math.sin((a * Math.PI) / 180) * 9}
              x2={14 + Math.cos((a * Math.PI) / 180) * 13} y2={14 + Math.sin((a * Math.PI) / 180) * 13}
              stroke={color} strokeWidth="2.4" strokeLinecap="round" />
          ))}
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M17 2 A12 12 0 1 0 26 16 A9.5 9.5 0 0 1 17 2 Z" fill={color} />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M14 1.5 L24.5 5.5 V14 C24.5 20.8 20 25 14 27 C8 25 3.5 20.8 3.5 14 V5.5 Z" fill={color} />
          <path d="M14 5 L21 7.8 V14 C21 18.8 18 21.8 14 23.4 Z" fill="rgba(0,0,0,0.22)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <polygon points="14,1 17.2,10 27,10.4 19.3,16.4 22,26 14,20.4 6,26 8.7,16.4 1,10.4 10.8,10" fill={color} />
        </svg>
      );
  }
}

function ModalShell({ id, closing, onClose, className, children }) {
  useEffect(() => {
    const kd = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [onClose]);
  return (
    <div
      className={"irg-backdrop" + (closing ? " irg-closing" : "")}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={"irg-modal " + className} role="dialog" aria-modal="true" data-irg-modal={id}>
        <button type="button" className="irg-x" onClick={onClose} aria-label="Chiudi">✕</button>
        {children}
      </div>
    </div>
  );
}

/* — 1. Bacheca: crea torneo — */
const BOARD_GIOCHI = ["Modern", "Standard", "Commander", "Legacy", "Pioneer", "Premodern", "Old School"];
const TIPI_TORNEO = ["Eliminazione diretta", "Doppia eliminazione", "Gironi"];
const defaultDateIso = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const itDate = (iso) => (iso && iso.includes("-") ? iso.split("-").reverse().join("/") : iso);

function BoardModal({ onPublish, onClose, playSfx }) {
  const [form, setForm] = useState({
    nome: "", gioco: BOARD_GIOCHI[0], tipo: TIPI_TORNEO[0], max: 2, data: defaultDateIso(), premio: "",
  });
  const [err, setErr] = useState(false);
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErr(true); playSfx("error");
      setTimeout(() => setErr(false), 450);
      return;
    }
    setDone(onPublish(form));
  };

  if (done) {
    return (
      <>
        <div className="irg-mtitle">📌 CREA TORNEO</div>
        <div className="irg-pinwrap">
          <div className="irg-pinned">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{done.nome}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: "#6b5236" }}>
              {done.gioco} · Forma {BEST_OF_LABEL[done.bestOf]}<br />
              {done.tipo} · max {done.maxPlayers} giocatori<br />
              inizio: {done.dataInizio}{done.premio ? <><br />🏆 {done.premio}</> : null}
            </div>
          </div>
          <div className="irg-ok">✓ TORNEO PUBBLICATO!</div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button type="button" className="irg-btn"
              onClick={() => { setForm((f) => ({ ...f, nome: "", premio: "" })); setDone(null); }}>
              ➕ Crea un altro
            </button>
            <button type="button" className="irg-btn" onClick={onClose}>Chiudi</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="irg-mtitle">📌 CREA TORNEO <span className="irg-esc">ESC per chiudere</span></div>
      <form onSubmit={submit}>
        <div className="irg-paper irg-tilt-l">
          <div className="irg-field">
            <label htmlFor="irg-nome">Nome torneo</label>
            <input id="irg-nome" name="nome" className={"irg-input" + (err ? " irg-err" : "")}
              placeholder="es. Coppa della Gilda" value={form.nome} onChange={set("nome")} maxLength={48} />
          </div>
          <div className="irg-field" style={{ marginBottom: 2 }}>
            <label htmlFor="irg-gioco">Gioco / formato carte</label>
            <select id="irg-gioco" className="irg-input" value={form.gioco} onChange={set("gioco")}>
              {BOARD_GIOCHI.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
        <div className="irg-paper irg-tilt-r">
          <div className="irg-grid2">
            <div className="irg-field">
              <label htmlFor="irg-tipo">Tipo torneo</label>
              <select id="irg-tipo" className="irg-input" value={form.tipo} onChange={set("tipo")}>
                {TIPI_TORNEO.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="irg-field">
              <label htmlFor="irg-max">Max partecipanti</label>
              <select id="irg-max" className="irg-input" value={form.max} onChange={set("max")}>
                {[2, 4, 8, 16].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="irg-field">
              <label htmlFor="irg-data">Data di inizio</label>
              <input id="irg-data" type="date" className="irg-input" value={form.data} onChange={set("data")} />
            </div>
            <div className="irg-field">
              <label htmlFor="irg-premio">Premio</label>
              <input id="irg-premio" className="irg-input" placeholder="es. Box di buste + trofeo"
                value={form.premio} onChange={set("premio")} maxLength={60} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <button type="submit" className="irg-btn irg-wide">📌 Pubblica torneo</button>
        </div>
      </form>
    </>
  );
}

/* — 2. Tavolo: i miei deck — */
function DecksModal({ decks, cards, popular, onCreateDeck, newDeckId }) {
  const [tab, setTab] = useState("decks");
  const TABS = [["decks", "I miei deck"], ["pop", "Deck popolari"], ["inv", "Inventario"]];
  return (
    <>
      <div className="irg-ebx-h1">I Miei <b>Deck</b></div>
      <div className="irg-ebx-sub">Collezione e mazzi da torneo <span className="irg-esc">ESC per chiudere</span></div>
      <div className="irg-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" className={"irg-tab" + (tab === id ? " irg-on" : "")}
            onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="irg-panel">
        {tab === "decks" && (
          <>
            <button type="button" className="irg-ebx-join" onClick={onCreateDeck}
              style={{ width: "100%", justifyContent: "center", padding: "10px 14px", fontSize: 12, marginBottom: 12 }}>
              <IcoPlus /> Crea nuovo deck
            </button>
            <div className="irg-deckgrid">
              {decks.map((d) => (
                <div key={d.id} className={"irg-deck" + (d.id === newDeckId ? " irg-new" : "")}
                  style={{ "--dc": d.colore }}>
                  <div className="irg-deckname">
                    <i className="irg-gem" style={{ background: d.colore }} />
                    {d.nome}
                  </div>
                  <div className="irg-deckmeta">
                    <span>{d.carte} carte</span>
                    <span className={"irg-deckok " + (d.carte >= 40 ? "si" : "no")}>
                      {d.carte >= 40 ? "Legale" : "In costruzione"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {tab === "pop" && (
          <div>
            {popular.map((d, i) => (
              <div key={d.id} className="irg-poprow">
                <div className="irg-rank">#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="irg-popname">
                    <i className="irg-gem" style={{ background: d.colore }} />
                    {d.nome}
                  </div>
                  <div className="irg-popauth">di @{d.autore} · usato dal {d.uso}% dei giocatori</div>
                  <div className="irg-bar"><i style={{ width: (d.uso * 5) + "%" }} /></div>
                </div>
                <div className="irg-wr">WR {d.winrate}%</div>
              </div>
            ))}
          </div>
        )}
        {tab === "inv" && (
          <div className="irg-cardgrid">
            {cards.map((c) => {
              const r = RAR[c.rarita] || RAR.comune;
              return (
                <div key={c.id} className={"irg-card irg-r-" + c.rarita} title={c.nome + " — " + r.label}>
                  <div className="irg-cardart" style={{
                    background: "radial-gradient(120% 120% at 30% 18%," + hexA(r.c, 0.42) + " 0%," +
                      hexA(r.c, 0.12) + " 55%,rgba(10,6,24,.35) 100%)",
                  }}>
                    <span style={{ opacity: 0.3, display: "inline-flex" }}>
                      <Sigil type={c.sig} size={30} color="#ffffff" />
                    </span>
                    <div className="irg-cost">{c.costo}</div>
                  </div>
                  <div className="irg-cardname">{c.nome}</div>
                  <div className="irg-rar" style={{ color: r.c }}>
                    <i className="irg-gem" style={{ background: r.c }} />
                    {r.label} · {c.tipo}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* — 3. PC: tabella tornei (replica della dashboard di tournaments-live-frontend) — */

/** "Forma" dal mockup: best-of mostrato come frazione (2/3, 3/5). */
const BEST_OF_LABEL = { BO1: "1", BO3: "2/3", BO5: "3/5" };

const EBX_COUNTRIES = [
  { code: "IT", flag: "🇮🇹", name: "Italia" },
  { code: "US", flag: "🇺🇸", name: "Stati Uniti" },
  { code: "DE", flag: "🇩🇪", name: "Germania" },
  { code: "FR", flag: "🇫🇷", name: "Francia" },
  { code: "ES", flag: "🇪🇸", name: "Spagna" },
  { code: "GB", flag: "🇬🇧", name: "Regno Unito" },
];

const EBX_DECKS = {
  "old-school": ["The Deck", "Mono Black Control", "Erhnam Geddon", "Atog Burn"],
  premodern: ["Elves", "Goblins", "Replenish", "Landstill", "Trix"],
  pioneer: ["Rakdos Midrange", "Mono White Humans", "Lotus Field Combo", "Azorius Control"],
  modern: ["Izzet Murktide", "Temur Rhinos", "Amulet Titan", "Mono Black Coffers"],
  standard: ["Esper Midrange", "Red Deck Wins", "Domain Control", "Golgari Midrange"],
  legacy: ["Delver of Secrets", "Reanimator", "Death and Taxes", "Initiative Stompy"],
  commander: ["Atraxa, Praetors' Voice", "Urza, Lord High Artificer", "Krenko, Mob Boss", "Kenrith, the Returned King"],
};

/** Dettagli mockup stabili basati su username e formato (stessa logica del frontend). */
function participantDetails(username, format) {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash);
  const country = EBX_COUNTRIES[index % EBX_COUNTRIES.length];
  const decks = EBX_DECKS[format] || ["Mono Red Burn", "Blue-White Control", "Green Stompy"];
  return { country, deck: decks[index % decks.length] };
}

/* icone inline (equivalenti di lucide: clock, check, eye, lock, plus, user-plus) */
function EbxIco({ d, size = 14, children, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...rest}>
      {d ? <path d={d} /> : null}{children}
    </svg>
  );
}
const IcoClock = () => <EbxIco d="M8 4.6V8l2.3 1.5" className="irg-pulse"><circle cx="8" cy="8" r="6.2" /></EbxIco>;
const IcoCheck = () => <EbxIco d="M5.2 8.3l1.9 1.9 3.7-4.4"><circle cx="8" cy="8" r="6.2" /></EbxIco>;
const IcoEye = () => <EbxIco d="M1.6 8c2.2-4.3 10.6-4.3 12.8 0-2.2 4.3-10.6 4.3-12.8 0Z"><circle cx="8" cy="8" r="1.9" /></EbxIco>;
const IcoLock = () => <EbxIco d="M5.5 7V5.4a2.5 2.5 0 0 1 5 0V7"><rect x="3.6" y="7" width="8.8" height="6.2" rx="1.6" /></EbxIco>;
const IcoPlus = () => <EbxIco d="M8 3.5v9M3.5 8h9" size={13} />;
const IcoUserPlus = () => <EbxIco d="M2.2 13.2c.6-2.4 2.2-3.6 4.1-3.6s3.5 1.2 4.1 3.6M12.6 5.6v4M10.6 7.6h4" size={13}><circle cx="6.3" cy="5.2" r="2.4" /></EbxIco>;

function StatusBadge({ status }) {
  if (status === "in_registrazione") return <span className="irg-sb reg"><IcoClock /> In Registrazione</span>;
  if (status === "iniziata") return <span className="irg-sb live"><i className="irg-dot" /> Iniziata</span>;
  return <span className="irg-sb end"><IcoCheck /> Terminata</span>;
}

function MiniTip({ text }) {
  return (
    <span className="irg-pop">
      <span className="irg-poparrow" />
      <span className="irg-popcard irg-popmini">{text}</span>
    </span>
  );
}

function PcModal({ tournaments, onJoin, me, formatName, modeName }) {
  return (
    <>
      <div className="irg-screen">
        <div className="irg-pcwrap">
          <div className="irg-ebx-h1">Tornei <b>Live</b></div>
          <div className="irg-ebx-sub">
            {formatName && <>{formatName} · </>}
            {modeName} · Buy-In <b>For Fun</b> <span className="irg-esc">ESC per chiudere</span>
          </div>
          {tournaments.length === 0 ? (
            <div className="irg-glass irg-ebx-empty">
              <p>Nessun torneo per questa selezione</p>
              <span>Creane uno dalla bacheca con “Crea Torneo”.</span>
            </div>
          ) : (
            <div className="irg-glass">
              <div className="irg-tablewrap">
                <table className="irg-ebx-table">
                  <thead>
                    <tr>
                      <th scope="col">Buy-In</th>
                      <th scope="col">Forma</th>
                      <th scope="col">Stato</th>
                      <th scope="col">Registrati</th>
                      <th scope="col">Partecipanti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => {
                      const full = t.participants.length >= t.maxPlayers;
                      const joined = t.participants.some((p) => p.username === me);
                      const shown = t.participants.slice(0, 2); // max 2 pill per partita
                      const extra = t.participants.length - shown.length;
                      return (
                        <tr key={t.id}>
                          <td><span className="irg-buyin">For Fun</span></td>
                          <td><span className="irg-forma">{BEST_OF_LABEL[t.bestOf] || "2/3"}</span></td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <StatusBadge status={t.status} />
                              {t.status === "iniziata" && (
                                <span className="irg-tip">
                                  <span className="irg-eye"><IcoEye /></span>
                                  <MiniTip text="Guarda partita live" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="irg-regnum">{t.participants.length}/{t.maxPlayers}</span>
                              {t.isPrivate && (
                                <span className="irg-tip" style={{ color: "#f59e0b" }}>
                                  <IcoLock />
                                  <MiniTip text="Partita privata" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            {t.participants.length === 0 && t.status !== "in_registrazione" ? (
                              <span className="irg-mut">—</span>
                            ) : (
                              <ul className="irg-plist">
                                {shown.map((p) => {
                                  const { country, deck } = participantDetails(p.username, t.format);
                                  return (
                                    <li key={p.id} className="irg-ppill irg-tip">
                                      {p.username}
                                      <span className="irg-pop">
                                        <span className="irg-poparrow" />
                                        <span className="irg-popcard">
                                          <span className="irg-pchead">
                                            <span>{p.username}</span>
                                            <span className="irg-flagchip">{country.flag} {country.code}</span>
                                          </span>
                                          <span className="irg-pcrow"><span>Paese:</span><b>{country.name}</b></span>
                                          <span className="irg-pcrow"><span>Stato:</span><b className="irg-on">Online</b></span>
                                          <span className="irg-pclab">Mazzo in uso</span>
                                          <span className="irg-pcdeck">{deck}</span>
                                        </span>
                                      </span>
                                    </li>
                                  );
                                })}
                                {extra > 0 && (
                                  <li className="irg-ppill irg-tip">
                                    +{extra}
                                    <span className="irg-pop">
                                      <span className="irg-poparrow" />
                                      <span className="irg-popcard" style={{ width: "auto", minWidth: 110 }}>
                                        {t.participants.slice(2).map((p) => (
                                          <span key={p.id} style={{ display: "block", padding: "1px 0" }}>{p.username}</span>
                                        ))}
                                      </span>
                                    </span>
                                  </li>
                                )}
                                {t.status === "in_registrazione" && !joined && !full && (
                                  <li>
                                    <button type="button" className="irg-ebx-join" onClick={() => onJoin(t.id)}>
                                      {t.isPrivate ? <><IcoUserPlus /> Chiedi di partecipare</> : <><IcoPlus /> Partecipa</>}
                                    </button>
                                  </li>
                                )}
                              </ul>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
      <span className="irg-brand">Ebartex Live Games</span>
      <span className="irg-led" />
    </>
  );
}

/* ====================== 10. COMPONENTE PRINCIPALE ====================== */

export default function IsoRoomGame({
  roomName = "Sala Tornei",
  username = "PrincessLeo",
  formatName = "",
  modeName = "Heads-Up",
  tournaments: pTournaments,
  decks: pDecks,
  cards: pCards,
  onCreateTournament,
  onJoinTournament,
  onCreateDeck,
  __debug,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const apiRef = useRef({});
  const closingRef = useRef(false);
  const mountedRef = useRef(true);

  const [modal, setModal] = useState(null);
  const [closing, setClosing] = useState(false);
  const [muted, setMuted] = useState(false);
  const [hint, setHint] = useState(true);
  const [newDeckId, setNewDeckId] = useState(null);
  const [data, setData] = useState(() => ({
    tournaments: pTournaments || mockTournaments(),
    decks: pDecks || mockDecks(),
    cards: pCards || mockCards(),
  }));

  apiRef.current.openModal = (id) => { if (mountedRef.current) setModal(id); };
  apiRef.current.hideHint = () => { if (mountedRef.current) setHint(false); };

  /* statistiche per il clipboard a muro (mock se non c'è storico reale) */
  const statsRef = useRef(null);
  if (!statsRef.current) {
    const mine = (pTournaments || []).filter(
      (t) => Array.isArray(t.participants) && t.participants.some((p) => p.username === username)
    );
    const ended = mine.filter((t) => t.status === "terminata").length;
    statsRef.current = ended > 0
      ? { giocati: ended, vinti: Math.max(1, Math.round(ended * 0.58)) }
      : { giocati: 12, vinti: 7 };
  }

  /* sync con le props (se fornite dal backend) */
  useEffect(() => { if (pTournaments) setData((d) => ({ ...d, tournaments: pTournaments })); }, [pTournaments]);

  /* eventi diegetici: nuovi tornei o tornei appena iniziati → citofono / alert PC */
  const prevTRef = useRef(null);
  useEffect(() => {
    if (pTournaments && prevTRef.current && gameRef.current) {
      const prev = prevTRef.current;
      const news = pTournaments.filter((t) => !prev.some((p) => p.id === t.id));
      const started = pTournaments.filter((t) => {
        const p = prev.find((q) => q.id === t.id);
        return p && p.status !== "iniziata" && t.status === "iniziata";
      });
      const g = gameRef.current;
      if (news.length && g.ring) g.ring(news.length === 1 ? "Nuovo torneo in bacheca!" : `${news.length} nuovi tornei in bacheca!`);
      else if (started.length && g.notify) g.notify();
    }
    if (pTournaments) prevTRef.current = pTournaments;
  }, [pTournaments]);
  useEffect(() => { if (pDecks) setData((d) => ({ ...d, decks: pDecks })); }, [pDecks]);
  useEffect(() => { if (pCards) setData((d) => ({ ...d, cards: pCards })); }, [pCards]);

  /* mount/unmount del gioco */
  useEffect(() => {
    mountedRef.current = true;
    injectCss();
    let game = null;
    try {
      game = createGame(canvasRef.current, wrapRef.current, apiRef, __debug, { stats: statsRef.current });
    } catch (err) {
      console.error("[IsoRoomGame] inizializzazione fallita:", err);
    }
    gameRef.current = game;
    return () => {
      mountedRef.current = false;
      if (game) game.destroy();
      gameRef.current = null;
      removeCss();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* avversario fantasma + countdown sveglia: derivati dai tornei a cui partecipo */
  const cdSetRef = useRef(null);
  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    const mine = data.tournaments.filter(
      (t) => Array.isArray(t.participants) && t.participants.some((p) => p.username === username)
    );
    const withOpp = mine.find((t) => t.status !== "terminata" && t.participants.length > 1);
    const opp = withOpp ? withOpp.participants.find((p) => p.username !== username) : null;
    if (g.setGhost) g.setGhost(opp ? opp.username : null);
    const reg = mine.find((t) => t.status === "in_registrazione");
    if (g.setCountdown) {
      if (reg && cdSetRef.current !== reg.id) {
        cdSetRef.current = reg.id;
        g.setCountdown(Date.now() + 5 * 60 * 1000); // mock: si parte tra 5 minuti
      } else if (!reg) {
        cdSetRef.current = null;
        g.setCountdown(null);
      }
    }
  }, [data.tournaments, username]);

  const playSfx = useCallback((name) => {
    const g = gameRef.current;
    if (g && g.sfx && typeof g.sfx[name] === "function") g.sfx[name]();
  }, []);

  const closeModal = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    setTimeout(() => {
      closingRef.current = false;
      if (!mountedRef.current) return;
      setClosing(false);
      setModal(null);
      setNewDeckId(null);
      if (gameRef.current) gameRef.current.zoomOut();
    }, 150);
  }, []);

  const handlePublish = useCallback((form) => {
    const t = {
      /* shape identica a tournaments-live-frontend (types/tournament.ts) */
      id: "t" + Date.now(),
      format: form.gioco.toLowerCase().replace(/\s+/g, "-"),
      mode: "torneo",
      buyIn: "for_fun",
      bestOf: form.tipo === "Gironi" ? "BO1" : "BO3",
      status: "in_registrazione",
      maxPlayers: +form.max,
      participants: [{ id: "me", username }],
      createdAt: new Date().toISOString(),
      isPrivate: false,
      /* extra della bacheca (utili al backend, ignorati dalla tabella) */
      nome: form.nome.trim(),
      gioco: form.gioco,
      tipo: form.tipo,
      dataInizio: itDate(form.data),
      premio: form.premio,
    };
    setData((d) => ({ ...d, tournaments: [t, ...d.tournaments] }));
    playSfx("pin");
    if (onCreateTournament) onCreateTournament(t);
    return t;
  }, [onCreateTournament, playSfx, username]);

  const handleJoin = useCallback((id) => {
    /* il bottone è visibile solo se l'iscrizione è valida (aperta, non pieno, non già dentro) */
    setData((d) => ({
      ...d,
      tournaments: d.tournaments.map((t) => {
        if (t.id !== id || t.status !== "in_registrazione") return t;
        if (t.participants.length >= t.maxPlayers || t.participants.some((p) => p.username === username)) return t;
        const participants = [...t.participants, { id: "me-" + id, username }];
        return { ...t, participants, status: participants.length >= t.maxPlayers ? "iniziata" : t.status };
      }),
    }));
    playSfx("success");
    if (onJoinTournament) onJoinTournament(id);
  }, [onJoinTournament, playSfx, username]);

  const handleCreateDeck = useCallback(() => {
    const palette = ["#e0564d", "#4a7fd6", "#5da24e", "#9a6ad6", "#f2b94b", "#46b8a5"];
    const d2 = {
      id: Date.now(),
      nome: "Nuovo Deck",
      carte: 0,
      colore: palette[Math.floor(Math.random() * palette.length)],
      sig: ["star", "bolt", "moon", "shield"][Math.floor(Math.random() * 4)],
    };
    setData((d) => ({ ...d, decks: [...d.decks, d2] }));
    setNewDeckId(d2.id);
    playSfx("success");
    if (onCreateDeck) onCreateDeck(d2);
  }, [onCreateDeck, playSfx]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nm = !m;
      if (gameRef.current) gameRef.current.setMuted(nm);
      return nm;
    });
  }, []);

  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div ref={wrapRef} className="irg-root">
      <canvas ref={canvasRef} className="irg-canvas" />

      {/* HUD */}
      <div className="irg-chip irg-title"><span aria-hidden>🏆</span>{roomName}</div>
      <button type="button" className="irg-mute" onClick={toggleMute}
        aria-label={muted ? "Riattiva audio" : "Silenzia audio"}>
        {muted ? "🔇" : "🔊"}
      </button>
      <div className={"irg-chip irg-hint" + (hint ? "" : " irg-off")}>
        {isTouch ? "TOCCA PER MUOVERTI" : "CLICCA PER MUOVERTI · WASD · 1/2/3 OGGETTI"}
      </div>
      <div className="irg-keys" aria-hidden>
        <div><b>1</b> PC · Tornei</div>
        <div><b>2</b> Tavolo · Deck</div>
        <div><b>3</b> Bacheca · Crea</div>
        <div><b>P</b> Foto 📸</div>
      </div>

      {/* modali */}
      {modal === "board" && (
        <ModalShell id="board" closing={closing} onClose={closeModal} className="irg-m-board">
          <BoardModal onPublish={handlePublish} onClose={closeModal} playSfx={playSfx} />
        </ModalShell>
      )}
      {modal === "decks" && (
        <ModalShell id="decks" closing={closing} onClose={closeModal} className="irg-m-decks">
          <DecksModal decks={data.decks} cards={data.cards} popular={POPULAR_DECKS}
            onCreateDeck={handleCreateDeck} newDeckId={newDeckId} />
        </ModalShell>
      )}
      {modal === "pc" && (
        <ModalShell id="pc" closing={closing} onClose={closeModal} className="irg-m-pc">
          <PcModal tournaments={data.tournaments} onJoin={handleJoin} me={username} formatName={formatName} modeName={modeName} />
        </ModalShell>
      )}
    </div>
  );
}
/* fine IsoRoomGame */
