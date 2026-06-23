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
 *   inventory           array    — inventario reale dell'utente per il deck builder
 *   onCreateTournament  (t)=>{}  — chiamata alla pubblicazione di un torneo
 *   onJoinTournament    (id)=>{} — chiamata all'iscrizione a un torneo
 *
 * Rendering: Canvas 2D puro, grafica 100% procedurale (nessun asset esterno,
 * solo Google Font "Press Start 2P" per i titoli). Niente localStorage.
 */
import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import { resolveQuality, getFxFlags, loadQuality, saveQuality } from "./quality-config";
import { DecksModal } from "./decks-modal";
import { StyledSelect } from "./styled-select";
import { buildArcadeBackground } from "./arcade-room/ArcadeBackground";
import { buildArcadeFurniture } from "./arcade-room/ArcadeSprites";
import {
  FURN_ARCADE, INTERACTIVES_ARCADE, DOOR_TOUR,
  ARC_ENTRY_TILE, TOUR_ENTRY_TILE, ARC_DEFAULT_CAM,
} from "./arcade-room/arcade-config";
import ArcadeGameModal from "./arcade-room/ArcadeGameModal";

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
  { key: "table", tiles: [[6, 2], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [6, 4], [7, 4], [8, 4]], inter: "decks" },
  { key: "stool", tiles: [[5, 3]] },
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
           approach: [[5, 4], [9, 3], [9, 2], [6, 1], [7, 1], [8, 1], [6, 5], [7, 5], [8, 5], [5, 2]],
           footTiles: [[6, 2], [7, 2], [8, 2], [6, 3], [7, 3], [8, 3], [6, 4], [7, 4], [8, 4]],
           focus: { x: 464, y: 310, z: 1.45 }, faceTile: [7, 3] },
  board: { name: "Bacheca",          icon: "📌", desc: "Crea Torneo",
           approach: [[3, 0], [4, 0], [5, 0]], footTiles: [],
           focus: { x: 472, y: 158, z: 1.6 }, faceTile: null },
  door:  DOOR_TOUR,
};

/* Giradischi: interattivo "leggero" (toggle musica, nessuna modale) */
const MUSIC_OBJ = { id: "music", approach: [[9, 1], [10, 2], [11, 2], [9, 0]], faceTile: [10, 1] };

/* Passi del tutorial guidato: l'omino entra, saluta, e visita PC → bacheca → tavolo.
   kind "say": battuta fino a digitazione + lettura; kind "demo": cammina all'oggetto,
   mostra la frase esterna fino in fondo (anche se la modale apre prima), poi spiega
   cosa farci dentro con `inside`, tiene aperta fino a lettura + punti caldi, poi chiude.
   Lo step con `intro:true` è il saluto grande al centro (poi la barra vola in alto).
   I tempi derivano da tutCaptionSec / tutHoldSec (allineati al typewriter React).
   kind "keys": evidenzia i badge in basso a sinistra (scorciatoie da tastiera).
   I "punti caldi" in modale sono in TUT_HOTSPOTS; quelli UI in TUT_UI_HOTSPOTS. */
const TUT_STEPS = [
  { kind: "say", intro: true, dur: 10, text: "Ciao! Sono Asso 🃏, la tua guida. In pochi secondi ti mostro i 3 punti chiave della stanza: seguimi!" },
  { kind: "demo", id: "pc",    text: "1 di 3 · Il PC 🖥️ — qui partecipi ai tornei e segui le partite dal vivo.",
    inside: "Scegli un formato in alto, poi premi Partecipa per iscriverti, oppure l'occhio 👁️ per guardare una live." },
  { kind: "demo", id: "board", text: "2 di 3 · La bacheca 📌 — qui crei i tuoi tornei, anche privati.",
    inside: "Dai un nome, scegli formato e regole, poi premi Pubblica: il torneo comparirà subito sul PC." },
  { kind: "demo", id: "decks", text: "3 di 3 · Il tavolo 🃏 — qui costruisci e salvi i tuoi mazzi.",
    inside: "Apri «Nuovo mazzo» per montarlo con le carte del tuo inventario e prepararti alla sfida." },
  { kind: "keys", id: "keys", text: "Premendo i tasti del tuo PC — o i badge qui in basso a sinistra — apri subito ciò che ti serve." },
];
/* Ritmo typewriter condiviso col banner React + tempo di lettura dopo la digitazione. */
const TUT_CHAR_MS = 52;
function tutPauseMs(ch) {
  return ".!?…".includes(ch) ? 520 : ",;:".includes(ch) ? 280 : TUT_CHAR_MS;
}
function tutTypingMs(text) {
  const chars = Array.from(text || "");
  if (!chars.length) return 0;
  let ms = TUT_CHAR_MS;
  for (const ch of chars) ms += tutPauseMs(ch);
  return ms;
}
function tutReadMs(text, { intro = false } = {}) {
  const n = Array.from(text || "").length;
  const base = intro ? 2600 : 2000;
  const perChar = intro ? 34 : 26;
  return base + n * perChar;
}
function tutCaptionMs(text, opts) {
  return tutTypingMs(text) + tutReadMs(text, opts);
}
function tutCaptionSec(text, opts) {
  return tutCaptionMs(text, opts) / 1000;
}
function tutHoldSec(step) {
  const insideMs = tutCaptionMs(step.inside || "");
  const spots = TUT_HOTSPOTS[step.id];
  const spotMs = spots && spots.length ? 900 + (spots.length - 1) * 950 : 0;
  return (insideMs + spotMs) / 1000;
}
function tutUiHoldSec(step) {
  const textMs = tutCaptionMs(step.text || "");
  const spots = TUT_UI_HOTSPOTS[step.id];
  const spotMs = spots && spots.length ? 900 + (spots.length - 1) * 950 : 0;
  return (textMs + spotMs) / 1000;
}
/* Messaggio finale (cartello grande ri-ingrandito con i bottoni di scelta). */
const TUT_OUTRO = "È tutto qui! 🎉 PC per giocare, bacheca per creare, tavolo per i mazzi. Ora esplora pure la stanza: benvenuto in\nEbartex Tournaments!";
const TUT_BRAND = "Ebartex Tournaments";
/* Placeholder breve mentre il banner si prepara (prima del saluto di Asso). */
const TUT_WAIT = "Ecco un breve tutorial, ti mostro la stanza";

/* Punti caldi evidenziati dentro le modali durante il tutorial: cerchio + cartello.
   `sel` mira a un elemento col selettore CSS, `text` lo cerca per etichetta (utile
   quando la modale non espone classi stabili). `side` posiziona il cartello. */
const TUT_HOTSPOTS = {
  pc: [
    { sel: ".irg-fmts",     label: "I 8 formati: passaci sopra per l'anteprima animata", side: "bottom" },
    { sel: ".irg-ebx-join", label: "Premi qui per iscriverti al torneo",                side: "left" },
    { sel: ".irg-eyebtn",   label: "L'occhio apre la partita in diretta",               side: "left" },
  ],
  board: [
    { sel: "#irg-nome", label: "Dai un nome al tuo torneo",                    side: "bottom" },
    { sel: ".irg-grid2", label: "Imposta formato, tipo e numero di giocatori", side: "top" },
    { sel: ".irg-wide",  label: "Pubblica: comparirà subito sul PC",           side: "top" },
  ],
  decks: [
    { text: "nuovo mazzo", label: "Crea qui il tuo nuovo mazzo", side: "bottom" },
  ],
};
/* Punti caldi fuori modale (es. legenda tasti in basso a sinistra). */
const TUT_UI_HOTSPOTS = {
  keys: [
    { sel: ".irg-keys .irg-key:nth-child(1)", label: "1 → PC · Tornei", side: "right" },
    { sel: ".irg-keys .irg-key:nth-child(2)", label: "2 → Tavolo · Deck", side: "right" },
    { sel: ".irg-keys .irg-key:nth-child(3)", label: "3 → Bacheca · Crea", side: "right" },
    { sel: ".irg-keys .irg-key:nth-child(4)", label: "P → Foto", side: "right" },
  ],
};

/** Stima durata di uno step (allineata a tutTick). */
function tutEstimatedStepSec(step) {
  if (step.kind === "say") {
    return step.dur ?? tutCaptionSec(step.text, { intro: !!step.intro });
  }
  if (step.kind === "keys") {
    return tutUiHoldSec(step);
  }
  const walk = Math.max(tutCaptionSec(step.text), 4.5);
  return walk + tutHoldSec(step) + 3.5;
}
function tutTotalDurationSec() {
  return TUT_STEPS.reduce((sum, step) => sum + tutEstimatedStepSec(step), 0);
}
function formatTutDurationLabel(sec) {
  const total = Math.ceil(sec);
  if (total < 60) return `circa ${total} s`;
  const min = Math.round(total / 60);
  return min === 1 ? "circa 1 min" : `circa ${min} min`;
}
const TUT_DURATION_LABEL = formatTutDurationLabel(tutTotalDurationSec());

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
};

/* Battute per i poster dinamici (carta della settimana / ban hammer) */
const BAN_LINES = [
  "Bandita per «eccesso di divertimento altrui» ⚖️",
  "Il giudice ha parlato: troppo forte perfino per il proprietario.",
  "Tre turni, zero interazione: il martello era inevitabile 🔨",
  "RIP. Era bella finché vinceva da sola.",
];
const WEEK_LINES = [
  "⭐ La più venduta su ebartex! Le altre carte rosicano.",
  "Vola in classifica vendite: il poster se l'è guadagnato.",
  "Top seller della settimana. Sì, ne ho già tre copie.",
];

/* Nomi torneo mock per la ricompensa crediti della busta lettere */
const MOCK_TOURNAMENT_NAMES = [
  "Coppa del Weekend", "Grand Prix Notturno", "Challenge d'Autunno",
  "Torneo dei Campioni", "Duello d'Estate", "Open del Venerdì",
  "Coppa Ebartex", "Memorial del Meta", "Rush Hour Cup",
];

const CREDIT_REWARD_NICE = [25, 50, 75, 100, 125, 150, 200];

function mockCreditReward() {
  const creditsBefore = 80 + Math.floor(Math.random() * 920);
  const creditsEarned =
    Math.random() < 0.45
      ? CREDIT_REWARD_NICE[Math.floor(Math.random() * CREDIT_REWARD_NICE.length)]
      : 15 + Math.floor(Math.random() * 136);
  return {
    creditsBefore,
    creditsEarned,
    creditsAfter: creditsBefore + creditsEarned,
  };
}

/** Valore crediti con effetto slot/casinò durante il reveal. */
function slotCreditValue(before, after, progress) {
  const spinStart = 0.1;
  const spinEnd = 0.94;
  if (progress < spinStart) return before;
  if (progress >= spinEnd) return after;
  const t = (progress - spinStart) / (spinEnd - spinStart);
  const eased = 1 - Math.pow(1 - t, 4.2);
  const base = before + (after - before) * eased;
  const jitterMax = Math.pow(1 - t, 2.2) * Math.max(12, (after - before) * 0.55);
  const jitter =
    (Math.sin(progress * 118 + before * 0.07) * 0.45 +
      Math.sin(progress * 73 + after * 0.11) * 0.55) *
    jitterMax;
  return Math.min(after, Math.max(before, Math.floor(base + jitter)));
}

function formatCredits(n) {
  return Math.round(n).toLocaleString("it-IT");
}

/** Layout card ricompensa crediti (coordinate locali, origine al centro).
 *  h:300 con padding 20px in basso sotto il bottone; btnCy assoluto dal centro. */
const CREDITS_REWARD_CARD = { w: 290, h: 300, btnW: 140, btnH: 32, btnCy: 114 };

/** URL sezione crediti del portale Ebartex (sottodominio account). */
const EBARTEX_CREDITO_URL = "https://www.ebartex.com/account/credito";
/** Colore arancione brand per il link "Ebartex". */
const EB_LINK_ORANGE = "#ff7a32";

/* Battute misteriose della modalità Shadow Realm */
const SHADOW_LINES = [
  "Il meta è un'illusione…",
  "Hai visto cosa c'è dietro il codice?",
  "Le carte ci guardano da sempre. Ora lo sai.",
  "Mezzanotte è solo un altro mulligan del tempo.",
  "Qui ogni topdeck era già scritto.",
  "Shhh… il Reame ascolta.",
];

/* Battute al risveglio dall'AFK (idle reward) */
const AFK_LINES = [
  "Ho meditato: il prossimo mazzo sarà leggendario 🧘",
  "Che pisolino! Energie al 100% 🔋",
  "Nel sogno ho toppato la combo. Buon segno ✨",
  "Mente lucida, mana pieno. Si gioca.",
];

/* Carte di Magic per Missy */
const MTG_CARDS = [
  "Black Lotus",
  "Ancestral Recall",
  "Time Walk",
  "Mox Sapphire",
  "Lightning Bolt",
  "Colossal Dreadmaw",
  "Thassa's Oracle",
  "Jace, the Mind Sculptor",
  "Force of Will",
  "Ragavan",
  "Black Cat",
  "Savannah Lions",
  "Sol Ring",
  "Tarmogoyf",
  "Wrath of God",
  "Nicol Bolas",
  "Cruel Ultimatum",
  "Gaea's Cradle",
  "Sheoldred",
  "Bolas's Citadel",
  "Thoughtseize",
  "Birds of Paradise"
];

const MTG_TEMPLATES = [
  (card) => `Miao miao... ${card}... miao! 🐈`,
  (card) => `Miao! ${card}! Purr... 🐾`,
  (card) => `Miao miao, ${card}, purr miao! 🐱`,
  (card) => `Miao... ${card}... miao miao. 🐈‍⬛`,
  (card) => `Miao! ${card}! Miao! 🐾`
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
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t) => t * t * t;
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
function buildBackground(phase = dayPhase(), stats = null, posters = null) {
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

  /* B) Specchio a parete (parete sinistra, oltre la finestra): personalizza l'avatar.
     (Sostituisce il vecchio poster TCG, poco utile.) Hit-test in `eggs` → modale "mirror". */
  quadFill(ctx, [wallL(8.05, 98), wallL(9.85, 98), wallL(9.85, 30), wallL(8.05, 30)], P.woodD);   // cornice esterna
  quadFill(ctx, [wallL(8.18, 95), wallL(9.72, 95), wallL(9.72, 33), wallL(8.18, 33)], P.woodL);   // bisello chiaro
  quadFill(ctx, [wallL(8.28, 93), wallL(9.62, 93), wallL(9.62, 35), wallL(8.28, 35)], P.woodD);   // bordo interno
  {
    const gt = wallL(8.95, 92), gb = wallL(8.95, 36);
    const mg = ctx.createLinearGradient(gt.x, gt.y, gb.x, gb.y);
    mg.addColorStop(0, "#dceaf4"); mg.addColorStop(0.45, "#a8c6dc"); mg.addColorStop(1, "#83a9c6");
    quadFill(ctx, [wallL(8.32, 91), wallL(9.58, 91), wallL(9.58, 37), wallL(8.32, 37)], mg);       // vetro
    // riflessi diagonali
    quadFill(ctx, [wallL(8.55, 89), wallL(8.95, 89), wallL(8.78, 39), wallL(8.38, 39)], "rgba(255,255,255,0.26)");
    quadFill(ctx, [wallL(9.22, 86), wallL(9.42, 86), wallL(9.32, 41), wallL(9.12, 41)], "rgba(255,255,255,0.15)");
    // accenno del pavimento riflesso in basso
    quadFill(ctx, [wallL(8.32, 49), wallL(9.58, 49), wallL(9.58, 37), wallL(8.32, 37)], "rgba(214,205,175,0.16)");
    // scintilla
    const spk = wallL(8.62, 84);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(Math.round(spk.x) - 1, Math.round(spk.y), 3, 1);
    ctx.fillRect(Math.round(spk.x), Math.round(spk.y) - 1, 1, 3);
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

  /* E/F) poster dinamici collegati alle carte del TCG (parete di fondo, vicino all'angolo):
     "Carta della Settimana" (top seller su ebartex) + "Ban Hammer" (carta bandita dal meta) */
  if (posters) {
    const WROT = Math.atan2(HTH, HTW); // inclinazione della parete di fondo
    /* mini-carta sul poster: cornice, gem di rarità, barrette di testo */
    const miniCard = (cpt, rar, banned) => {
      const rc = (RAR[rar] || RAR.comune).c;
      ctx.save();
      ctx.translate(cpt.x, cpt.y);
      ctx.rotate(WROT);
      // carta
      ctx.fillStyle = "#10142a"; ctx.fillRect(-8, -12, 16, 24);
      ctx.fillStyle = "#f5f0e2"; ctx.fillRect(-7, -11, 14, 22);
      ctx.fillStyle = rc; ctx.fillRect(-5, -9, 10, 9);
      ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.fillRect(-3, -7, 3, 3);
      ctx.fillStyle = "#2e2a3a";
      ctx.fillRect(-5, 3, 10, 1.5); ctx.fillRect(-5, 6, 7, 1.5);
      if (banned) {
        // X rossa pixelata sopra la carta
        ctx.fillStyle = "#e03a30";
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(i * 4 - 2, i * 4 - 2, 4, 4);
          ctx.fillRect(-i * 4 - 2, i * 4 - 2, 4, 4);
        }
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        for (let i = -2; i <= 2; i++) ctx.fillRect(i * 4 - 2, i * 4 - 3, 4, 1);
      }
      ctx.restore();
    };
    /* — Carta della Settimana — */
    if (posters.week) {
      posterBg(wallR, 0.55, 1.6, 92, 42, "#1d2a4d");
      quadFill(ctx, [wallR(0.63, 89), wallR(1.52, 89), wallR(1.52, 45), wallR(0.63, 45)], false, P.gold, 1);
      // stellina in alto
      const sw = wallR(1.07, 83);
      ctx.fillStyle = P.gold;
      ctx.fillRect(Math.round(sw.x) - 1, Math.round(sw.y) - 4, 2, 8);
      ctx.fillRect(Math.round(sw.x) - 4, Math.round(sw.y) - 1, 8, 2);
      ctx.fillRect(Math.round(sw.x) - 2, Math.round(sw.y) - 2, 4, 4);
      miniCard(wallR(1.07, 66), posters.week.rarita, false);
      band(wallR, 0.72, 1.42, 52, 49.5, "rgba(255,255,255,0.85)");
      band(wallR, 0.82, 1.32, 47.5, 45.8, "rgba(243,199,106,0.7)");
    }
    /* — Ban Hammer — */
    if (posters.ban) {
      posterBg(wallR, 1.8, 2.85, 92, 42, "#33203a");
      quadFill(ctx, [wallR(1.88, 89), wallR(2.77, 89), wallR(2.77, 45), wallR(1.88, 45)], false, "#a85a5a", 1);
      miniCard(wallR(2.32, 66), posters.ban.rarita, true);
      // martello da giudice appoggiato in basso a destra
      const hm = wallR(2.62, 50);
      ctx.save();
      ctx.translate(hm.x, hm.y);
      ctx.rotate(WROT - 0.7);
      ctx.fillStyle = P.woodD; ctx.fillRect(-1.5, -2, 3, 16);   // manico
      ctx.fillStyle = P.metal; ctx.fillRect(-6, -7, 12, 6);     // testa
      ctx.fillStyle = P.metalL; ctx.fillRect(-6, -7, 12, 2);
      ctx.restore();
      band(wallR, 1.97, 2.67, 52, 49.5, "rgba(255,255,255,0.7)");
      band(wallR, 2.07, 2.57, 47.5, 45.8, "rgba(224,58,48,0.8)");
    }
  }

  /* — porta Sala Arcade (parete di fondo, c=5.0–6.5, hh=40–88) — */
  {
    const WROT = Math.atan2(HTH, HTW);
    const dTL = wallR(5.0, 88), dTR = wallR(6.5, 88);
    const dBL = wallR(5.0, 40), dBR = wallR(6.5, 40);
    // rientranza
    quadFill(ctx, [wallR(4.8, 95), wallR(6.7, 95), wallR(6.7, 36), wallR(4.8, 36)], shade(P.wall, 0.72));
    // pannello porta (sfondo scuro)
    quadFill(ctx, [dTL, dTR, dBR, dBL], shade(P.wallDark, 0.7));
    // bordo dorato
    ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(dTL.x, dTL.y); ctx.lineTo(dTR.x, dTR.y);
    ctx.lineTo(dBR.x, dBR.y); ctx.lineTo(dBL.x, dBL.y); ctx.closePath(); ctx.stroke();
    // pannello interno
    const ip = (pts, d) => pts.map((p, i) => ({
      x: p.x + ([0,3].includes(i) ? d : -d),
      y: p.y + ([0,1].includes(i) ? d : -d),
    }));
    quadFill(ctx, ip([dTL, dTR, dBR, dBL], 4), shade(P.wallDark, 0.85));
    // riga orizzontale a metà (pannelli porta)
    const mh = 64;
    quadFill(ctx, [wallR(5.0, mh), wallR(6.5, mh), wallR(6.5, mh - 3), wallR(5.0, mh - 3)], hexA(P.gold, 0.45));
    // maniglia
    const han = wallR(6.15, 60);
    ctx.fillStyle = P.gold;
    ctx.fillRect(Math.round(han.x) - 1, Math.round(han.y) - 5, 3, 10);
    // insegna "ARCADE" sopra la porta
    const signPt = wallR(5.75, 93);
    ctx.save();
    ctx.translate(signPt.x, signPt.y);
    ctx.rotate(WROT);
    ctx.fillStyle = "#151a2e";
    ctx.fillRect(-24, -6, 48, 10);
    ctx.strokeStyle = P.gold; ctx.lineWidth = 1;
    ctx.strokeRect(-24, -6, 48, 10);
    ctx.fillStyle = P.gold;
    ctx.font = "bold 6px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ARCADE", 0, 0);
    ctx.restore();
  }

  /* — pennanti tornei sulla parete di fondo — */
  {
    // Due striscioline colorate verticali appese in alto, come decorazioni da torneo
    const drawPennant = (wc, col) => {
      for (let i = 0; i < 5; i++) {
        const h0 = WALL_H - 6 - i * 12, h1 = h0 - 10;
        quadFill(ctx, [wallR(wc - 0.08, h0), wallR(wc + 0.08, h0),
                        wallR(wc + 0.08, h1), wallR(wc - 0.08, h1)],
          (i % 2 === 0) ? col : shade(col, 0.65));
      }
    };
    drawPennant(3.5, P.red);
    drawPennant(7.5, P.gold);
    drawPennant(9.2, "#4a7fd6");
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

  /* tavolo da gioco con panno verde, carte e deck (3x3: raddoppiato) */
  const table = mkSprite(3, 3, 72, (ctx) => {
    isoBox(ctx, 0, 0, 3, 3, 22, P.wood, { top: P.woodL });
    const inset = (i, dy) => [
      { x: isoVec(i, i).x, y: isoVec(i, i).y - dy },
      { x: isoVec(3 - i, i).x, y: isoVec(3 - i, i).y - dy },
      { x: isoVec(3 - i, 3 - i).x, y: isoVec(3 - i, 3 - i).y - dy },
      { x: isoVec(i, 3 - i).x, y: isoVec(i, 3 - i).y - dy },
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
    pile(0.63, 0.63, 5, P.red);
    pile(0.57, 1.98, 4, "#4a7fd6");
    pile(2.13, 0.69, 3, "#9a6ad6");
    card(1.68, 1.68, "face", P.red);
    card(2.25, 2.13, "back", "#4a7fd6");
    card(1.42, 1.42, "face", "#9a6ad6", 0.6);
    card(2.37, 1.5, "back", P.red);
    card(0.7, 1.35, "back", "#5da24e");
    card(1.95, 0.5, "face", "#f2b94b");
    // dado
    isoBox(ctx, 1.65, 2.43, 0.11, 0.11, 5, "#f5f0e2", { z: 23, noEdge: true });
    const dc = isoVec(1.705, 2.485);
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

/* — bacheca di sughero (sulla parete di fondo) —
   bracket=true: variante "tabellone torneo" con foglietti collegati da filo rosso */
function buildBoard(bracket = false) {
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
  if (bracket) {
    /* — tabellone torneo: 4 foglietti → 2 → 1, collegati da filo rosso — */
    const slots = [
      [3.22, 88, 0.42, 13], [3.22, 70, 0.42, 13],   // round 1 (alto/basso sinistra)
      [3.22, 52, 0.42, 13], [3.22, 34 + 18, 0.42, 13],
      [4.1, 80, 0.46, 14], [4.1, 56, 0.46, 14],     // semifinali
      [5.0, 68, 0.5, 16],                            // finale
    ];
    const pinCols = [P.red, "#4a7fd6", P.leaf, P.gold, P.red, "#4a7fd6", P.gold];
    const centers = [];
    slots.forEach(([c0, h0, wc, hh], i) => {
      sheet(c0, h0, wc, hh, i === 6 ? P.paperY : P.paper, pinCols[i]);
      centers.push(wp(c0 + wc, h0 - hh / 2));
    });
    // filo rosso: r1 → semifinali → finale
    ctx.strokeStyle = "rgba(217,79,70,0.85)"; ctx.lineWidth = 1.2;
    const link = (a, b) => {
      const pa = centers[a], pb = wp(slots[b][0], slots[b][1] - slots[b][3] / 2);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo((pa.x + pb.x) / 2, Math.max(pa.y, pb.y) + 3, pb.x, pb.y);
      ctx.stroke();
    };
    link(0, 4); link(1, 4); link(2, 5); link(3, 5); link(4, 6); link(5, 6);
    // coccarda LIVE sulla finale
    const lv = wp(5.28, 80);
    ctx.fillStyle = P.red;
    ctx.fillRect(Math.round(lv.x) - 8, Math.round(lv.y) - 4, 17, 8);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 5px 'Courier New', monospace";
    ctx.fillText("LIVE", Math.round(lv.x) - 6, Math.round(lv.y) + 2);
  } else {
    sheet(3.18, 88, 0.55, 20, P.paper, P.red);
    sheet(3.95, 91, 0.62, 24, P.paperY, "#4a7fd6");
    sheet(4.78, 88, 0.55, 18, P.paperP, P.gold);
    sheet(3.28, 60, 0.66, 22, P.paperY, P.leaf);
    sheet(5.05, 62, 0.42, 20, P.paper, "#4a7fd6");
    sheet(4.12, 64, 0.78, 30, P.paper, P.red);
  }
  // mini trofeo sul foglio centrale
  const tb = bracket ? wp(5.18, 56) : wp(4.51, 48);
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

/* — ancore (world-space) sopra cui si disegnano le frecce/etichette guida — */
const ICON_POS = {
  pc: { x: 196, y: 148 },
  decks: { x: 464, y: 284 },
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
  /* outfit alternativi (specchio) */
  hoodie: "#ff7a2f", hoodieL: "#ff9a55", hoodieD: "#d65f18",
  jacket: "#3a4660", jacketL: "#52617f", jacketD: "#26304a", tee: "#e7e3d8",
  shirt: "#dfe7f2", shirtL: "#f3f7fc", shirtD: "#b9c6da", btn: "#9fb0c6",
  jersey: "#2f9e6b", jerseyL: "#46c08a", jerseyD: "#1f7350", jerseyNum: "#f5f5ee",
};

/* Aspetto di default dell'avatar (capelli ricci + canotta = look storico). */
const DEFAULT_LOOK = { hair: "m3", outfit: "tank" };

/* ——— Outfit: ogni voce descrive maniche + disegno del torso ———————————————
   sleeve: "bare" braccia nude · "short" mezza manica · "long" manica lunga.
   chain: true mostra la catena d'oro col ciondolo "Q". */
const OUTFITS = {
  tank: {
    label: "Canotta", sleeve: "bare", chain: true,
    torso(px, b, back) {
      px(6, 20 + b, 17, 13, AV.tank);
      px(6, 20 + b, 2, 13, AV.tankL);
      px(21, 20 + b, 2, 13, AV.tankD);
      px(6, 31 + b, 17, 2, AV.tankD);
      if (!back) { px(11, 20 + b, 7, 2, AV.skin); px(11, 20 + b, 7, 1, AV.skinD); } // petto tra le spalline
    },
  },
  hoodie: {
    label: "Felpa", sleeve: "long", chain: false,
    arm: AV.hoodie, armD: AV.hoodieD, armL: AV.hoodieL,
    torso(px, b, back) {
      px(6, 20 + b, 17, 13, AV.hoodie);
      px(6, 20 + b, 2, 13, AV.hoodieL);
      px(21, 20 + b, 2, 13, AV.hoodieD);
      px(6, 31 + b, 17, 2, AV.hoodieD);
      if (!back) {
        px(8, 19 + b, 13, 3, AV.hoodieD);                              // collo della felpa
        px(9, 20 + b, 11, 1, AV.hoodieL);
        px(9, 27 + b, 11, 4, AV.hoodieD);                              // tasca a marsupio
        px(10, 28 + b, 9, 2, AV.hoodie);
        px(12, 22 + b, 1, 4, "#f2efe6"); px(16, 22 + b, 1, 4, "#f2efe6"); // lacci
        px(12, 26 + b, 1, 1, AV.gold); px(16, 26 + b, 1, 1, AV.gold);
        px(16, 23 + b, 3, 3, "#ffffff"); px(17, 24 + b, 1, 1, AV.hoodie); // logo
      } else {
        px(8, 19 + b, 13, 4, AV.hoodieD); px(9, 20 + b, 11, 2, AV.hoodie); // cappuccio
      }
    },
  },
  jacket: {
    label: "Bomber", sleeve: "long", chain: false,
    arm: AV.jacket, armD: AV.jacketD, armL: AV.jacketL,
    torso(px, b, back) {
      px(6, 20 + b, 17, 13, AV.jacket);
      px(6, 20 + b, 2, 13, AV.jacketL);
      px(21, 20 + b, 2, 13, AV.jacketD);
      px(6, 31 + b, 17, 2, AV.jacketD);
      px(6, 31 + b, 17, 1, AV.jacketL);                               // bordo a coste
      if (!back) {
        px(12, 20 + b, 5, 13, AV.tee);                                // t-shirt sotto
        px(12, 20 + b, 1, 13, "#ffffff");
        px(11, 20 + b, 1, 13, AV.jacketD); px(17, 20 + b, 1, 13, AV.jacketD); // zip
        px(9, 20 + b, 3, 2, AV.jacketL); px(17, 20 + b, 3, 2, AV.jacketL);     // colletto
      }
    },
  },
  shirt: {
    label: "Camicia", sleeve: "long", chain: false,
    arm: AV.shirt, armD: AV.shirtD, armL: AV.shirtL,
    torso(px, b, back) {
      px(6, 20 + b, 17, 13, AV.shirt);
      px(6, 20 + b, 2, 13, AV.shirtL);
      px(21, 20 + b, 2, 13, AV.shirtD);
      px(6, 31 + b, 17, 2, AV.shirtD);
      if (!back) {
        px(10, 19 + b, 3, 2, AV.shirtL); px(16, 19 + b, 3, 2, AV.shirtL); // colletto
        px(13, 20 + b, 3, 2, AV.skin);                                    // scollo aperto
        px(14, 22 + b, 1, 10, AV.shirtD);                                 // abbottonatura
        px(14, 24 + b, 1, 1, AV.btn); px(14, 27 + b, 1, 1, AV.btn); px(14, 30 + b, 1, 1, AV.btn);
      }
    },
  },
  jersey: {
    label: "Maglia", sleeve: "short", chain: false,
    arm: AV.jersey, armD: AV.jerseyD, armL: AV.jerseyL,
    torso(px, b, back) {
      px(6, 20 + b, 17, 13, AV.jersey);
      px(6, 20 + b, 2, 13, AV.jerseyL);
      px(21, 20 + b, 2, 13, AV.jerseyD);
      px(6, 31 + b, 17, 2, AV.jerseyD);
      px(6, 24 + b, 17, 2, AV.jerseyL);                               // fascia sul petto
      if (!back) {
        px(11, 20 + b, 7, 1, AV.jerseyD);                             // scollo
        px(12, 28 + b, 2, 4, AV.jerseyNum); px(15, 28 + b, 2, 4, AV.jerseyNum); // numero "11"
      } else {
        px(11, 26 + b, 2, 5, AV.jerseyNum); px(15, 26 + b, 2, 5, AV.jerseyNum);
      }
    },
  },
};

/* ——— Capelli: 3 maschili (m1–m3) + 3 femminili (f1–f3). Ogni stile ha la
   vista frontale e quella di spalle, dimensionata sulla testa (volto x6..22). */
const HAIR_STYLES = {
  // m1 — corto con riga laterale
  m1: {
    label: "Corto", sex: "m",
    front(px, b) {
      px(6, 2 + b, 17, 2, AV.hair);
      px(5, 3 + b, 19, 4, AV.hair);
      px(4, 5 + b, 2, 4, AV.hair); px(23, 5 + b, 2, 5, AV.hair);   // basette
      px(5, 7 + b, 18, 1, AV.hairD);                               // base frangia
      px(11, 3 + b, 1, 3, AV.hairL);                               // riga
      px(7, 2 + b, 9, 1, AV.hairL);                                // luce in alto
    },
    back(px, b) {
      px(5, 2 + b, 19, 3, AV.hair);
      px(4, 4 + b, 21, 9, AV.hair);
      px(5, 13 + b, 17, 2, AV.hairD);
      px(7, 3 + b, 10, 1, AV.hairL);
    },
  },
  // m2 — rasato/corto sfumato
  m2: {
    label: "Rasato", sex: "m",
    front(px, b) {
      px(6, 3 + b, 17, 2, AV.hair);
      px(5, 4 + b, 19, 3, AV.hair);
      px(5, 7 + b, 18, 1, AV.hairD);
      px(4, 5 + b, 1, 3, AV.hair); px(23, 5 + b, 2, 4, AV.hair);
      [[8, 4], [12, 4], [16, 4], [20, 4], [10, 5], [14, 5], [18, 5]].forEach(([x, y]) => px(x, y + b, 1, 1, AV.hairD));
    },
    back(px, b) {
      px(5, 4 + b, 19, 3, AV.hair);
      px(4, 6 + b, 21, 7, AV.hair);
      [[8, 7], [12, 8], [16, 7], [10, 10], [15, 10]].forEach(([x, y]) => px(x, y + b, 1, 1, AV.hairD));
    },
  },
  // m3 — ricci castani con meches bionde (look storico)
  m3: {
    label: "Ricci", sex: "m",
    front(px, b) {
      px(8, 0 + b, 5, 1, AV.hair); px(15, 0 + b, 5, 1, AV.hair);
      px(6, 1 + b, 17, 2, AV.hair);
      px(5, 2 + b, 19, 3, AV.hair);
      px(4, 4 + b, 21, 3, AV.hair);
      px(3, 5 + b, 1, 3, AV.hair); px(25, 5 + b, 1, 3, AV.hair);
      px(4, 7 + b, 3, 4, AV.hair);
      px(22, 7 + b, 3, 5, AV.hair);
      px(5, 7 + b, 19, 1, AV.hair);
      px(6, 8 + b, 3, 1, AV.hair); px(13, 8 + b, 3, 1, AV.hair); px(20, 8 + b, 2, 1, AV.hair);
      [[10, 2], [15, 2], [20, 4], [8, 5], [13, 6], [18, 6]].forEach(([x, y]) => px(x, y + b, 2, 2, AV.hairD));
      [[7, 1], [12, 1], [17, 1], [5, 3], [10, 4], [15, 4], [21, 3], [23, 7]]
        .forEach(([x, y]) => { px(x, y + b, 2, 1, AV.hairL); px(x + 1, y + 1 + b, 1, 1, AV.hairL); });
      px(8, 7 + b, 2, 1, AV.hairL); px(16, 7 + b, 2, 1, AV.hairL);
    },
    back(px, b) {
      px(8, 0 + b, 5, 2, AV.hair); px(15, 0 + b, 6, 2, AV.hair);
      px(5, 1 + b, 19, 5, AV.hair);
      px(4, 3 + b, 21, 10, AV.hair);
      px(3, 6 + b, 1, 4, AV.hair); px(25, 6 + b, 1, 4, AV.hair);
      px(5, 13 + b, 19, 3, AV.hair);
      px(6, 16 + b, 4, 1, AV.hair); px(12, 16 + b, 5, 1, AV.hair); px(19, 16 + b, 4, 1, AV.hair);
      [[10, 5], [16, 6], [7, 8], [13, 10], [19, 9], [9, 12], [15, 13]].forEach(([x, y]) => px(x, y + b, 2, 2, AV.hairD));
      [[7, 2], [13, 2], [18, 3], [5, 5], [11, 7], [15, 9], [6, 10], [20, 11], [10, 13], [17, 13]]
        .forEach(([x, y]) => { px(x, y + b, 2, 1, AV.hairL); px(x + 1, y + 1 + b, 1, 1, AV.hairL); });
    },
  },
  // f1 — caschetto (bob)
  f1: {
    label: "Caschetto", sex: "f",
    front(px, b) {
      px(7, 0 + b, 5, 1, AV.hair); px(15, 0 + b, 4, 1, AV.hair);
      px(5, 1 + b, 17, 3, AV.hair);
      px(4, 2 + b, 19, 4, AV.hair);
      px(3, 4 + b, 3, 12, AV.hair); px(23, 4 + b, 3, 12, AV.hair);   // lati fino alla mandibola
      px(5, 6 + b, 18, 1, AV.hair);                                  // frangia dritta
      px(5, 7 + b, 18, 1, AV.hairD);
      px(3, 15 + b, 3, 2, AV.hair); px(23, 15 + b, 3, 2, AV.hair);   // punte arrotondate
      px(6, 1 + b, 10, 1, AV.hairL); px(4, 4 + b, 1, 8, AV.hairL);
    },
    back(px, b) {
      px(5, 0 + b, 17, 3, AV.hair);
      px(3, 2 + b, 21, 15, AV.hair);
      px(4, 16 + b, 19, 2, AV.hairD);
      px(6, 1 + b, 10, 1, AV.hairL);
    },
  },
  // f2 — coda alta (ponytail)
  f2: {
    label: "Coda", sex: "f",
    front(px, b) {
      px(6, 1 + b, 17, 2, AV.hair);
      px(5, 2 + b, 19, 3, AV.hair);
      px(4, 4 + b, 21, 2, AV.hair);                                  // riempie la fronte (niente buco)
      px(4, 4 + b, 2, 4, AV.hair); px(23, 4 + b, 3, 5, AV.hair);
      px(5, 6 + b, 18, 1, AV.hairD);
      px(8, 6 + b, 3, 2, AV.hair); px(16, 6 + b, 3, 2, AV.hair);     // ciuffetti
      px(25, 8 + b, 3, 8, AV.hair); px(26, 10 + b, 2, 6, AV.hairD);  // coda dietro la spalla
      px(25, 8 + b, 1, 8, AV.hairL);
      px(24, 7 + b, 2, 2, AV.hairD);                                 // elastico
      px(7, 2 + b, 9, 1, AV.hairL);
    },
    back(px, b) {
      px(5, 1 + b, 17, 3, AV.hair);
      px(4, 3 + b, 21, 5, AV.hair);
      px(11, 7 + b, 7, 16, AV.hair);                                 // coda lungo la schiena
      px(12, 8 + b, 5, 15, AV.hairD);
      px(13, 9 + b, 2, 12, AV.hairL);
      px(11, 7 + b, 7, 2, AV.hairL);                                 // elastico
    },
  },
  // f3 — lunghi sciolti
  f3: {
    label: "Lunghi", sex: "f",
    front(px, b) {
      px(6, 0 + b, 17, 2, AV.hair);
      px(5, 1 + b, 19, 4, AV.hair);
      px(3, 3 + b, 3, 19, AV.hair); px(23, 3 + b, 3, 19, AV.hair);   // ciocche lungo il viso
      px(5, 5 + b, 18, 1, AV.hairD);                                 // frangia con riga
      px(13, 5 + b, 2, 3, AV.hair);
      px(3, 20 + b, 4, 2, AV.hair); px(22, 20 + b, 4, 2, AV.hair);   // punte
      px(4, 4 + b, 1, 15, AV.hairL); px(24, 4 + b, 1, 15, AV.hairD);
      px(6, 1 + b, 8, 1, AV.hairL);
    },
    back(px, b) {
      px(5, 0 + b, 17, 3, AV.hair);
      px(3, 2 + b, 21, 21, AV.hair);                                 // chioma lunga sulla schiena
      px(4, 22 + b, 19, 2, AV.hairD);
      px(5, 4 + b, 1, 16, AV.hairL);
      [[8, 8], [14, 12], [18, 16]].forEach(([x, y]) => px(x, y + b, 2, 2, AV.hairD));
    },
  },
};

/* Braccia con maniche secondo l'outfit (mano sempre scoperta). */
function drawArm(px, x, dy, isRight, back, O) {
  const skin = (back || isRight) ? AV.skinD : AV.skin;
  const hand = back ? AV.skin : (isRight ? AV.skin : AV.skinL);
  if (!O || O.sleeve === "bare") {
    px(x, 20 + dy, 3, 12, skin);
    if (!back && !isRight) px(x, 20 + dy, 1, 12, AV.skinL);
    px(x, 30 + dy, 3, 2, hand);
    return;
  }
  const col = isRight ? O.armD : O.arm;
  const bottom = O.sleeve === "long" ? 30 : 25;  // y fino a cui arriva la manica
  px(x, 20 + dy, 3, bottom - 20, col);
  if (!back && !isRight && O.armL) px(x, 20 + dy, 1, bottom - 20, O.armL);
  if (bottom < 32) px(x, bottom + dy, 3, 32 - bottom, skin);        // avambraccio nudo
  if (O.sleeve === "long") px(x, 29 + dy, 3, 1, isRight ? O.armD : (O.armL || col)); // polsino
  px(x, 30 + dy, 3, 2, hand);                                       // mano
}

function drawChibi(ctx, back, fr, blink, look) {
  const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const b = fr.bodyDy || 0;
  const L = look || DEFAULT_LOOK;
  const O = OUTFITS[L.outfit] || OUTFITS.tank;
  const H = HAIR_STYLES[L.hair] || HAIR_STYLES.m3;

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

  /* — braccia (maniche secondo l'outfit) — */
  drawArm(px, 4, b + fr.armA, false, back, O);
  drawArm(px, 22, b + fr.armB, true, back, O);

  /* — torso (outfit scelto allo specchio) — */
  O.torso(px, b, back);

  /* — collo — */
  px(12, 17 + b, 5, 4, AV.skin);
  px(12, 17 + b, 5, 1, AV.skinD);

  if (O.chain) {
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

  /* — capelli (stile scelto allo specchio, sopra tutto) — */
  if (back) H.back(px, b); else H.front(px, b);
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

function buildAvatar(look) {
  const L = look || DEFAULT_LOOK;
  const make = (back, fr, blink, flip) => {
    const raw = { cv: mkCanvas(29, 54), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(29, 0); ctx.scale(-1, 1); }
    ctx.translate(0, fr.sit ? 9 : 1); // margine per il bob / abbassamento da seduto
    drawChibi(ctx, back, fr, blink, L);
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

/* ====================== 5c. CANE HUSKY (pixel-art) ========================= */
/* "Cookie", husky grigia/bianca. Pose: sleep / sit / walk. */

function buildDog() {
  const C = { fur: "#4a4e59", dark: "#2c2e35", belly: "#ffffff", ear: "#383b43", eye: "#825329", nose: "#1d1e22" };
  const mk = (draw, flip) => {
    const raw = { cv: mkCanvas(32, 26), ax: 0, ay: 0 };
    const ctx = raw.cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (flip) { ctx.translate(32, 0); ctx.scale(-1, 1); }
    const px = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    draw(px);
    ctx.restore();
    const sp = outlined(raw);
    sp.feet = { x: 16, y: 26 };
    return sp;
  };
  const walkFr = (f) => (px) => {
    // corpo, testa a destra
    px(4, 9, 17, 9, C.fur);
    px(5, 15, 15, 3, C.belly);
    px(4, 9, 8, 5, C.dark);
    // zampe
    px(5 + (f ? 2 : 0), 18, 2, 6, C.fur); px(5 + (f ? 2 : 0), 23, 2, 1, C.belly);
    px(10 - (f ? 2 : 0), 18, 2, 6, C.fur); px(10 - (f ? 2 : 0), 23, 2, 1, C.belly);
    px(15 + (f ? -2 : 0), 18, 2, 6, C.fur); px(15 + (f ? -2 : 0), 23, 2, 1, C.belly);
    px(19 + (f ? 2 : 0), 18, 2, 6, C.fur); px(19 + (f ? 2 : 0), 23, 2, 1, C.belly);
    // coda
    px(1, 4 + (f ? 1 : 0), 4, 7, C.fur); px(2, 3 + (f ? 1 : 0), 2, 2, C.belly);
    // testa (faccia bianca, retro scuro)
    px(20, 3, 9, 9, C.belly);
    px(20, 3, 3, 9, C.fur);
    px(20, 0, 3, 4, C.dark); px(25, 0, 3, 4, C.dark);
    px(21, 1, 1, 3, C.belly); px(26, 1, 1, 3, C.belly);
    px(22, 5, 1, 2, C.eye); px(26, 5, 1, 2, C.eye);
    px(27, 8, 3, 2, C.nose);
  };
  const sitFr = (f) => (px) => {
    px(8, 9, 13, 12, C.fur);
    px(8, 9, 10, 5, C.dark);
    px(10, 14, 8, 7, C.belly);
    // zampe
    px(9, 21, 3, 3, C.fur); px(9, 23, 3, 1, C.belly);
    px(16, 21, 3, 3, C.fur); px(16, 23, 3, 1, C.belly);
    // coda
    px(21 + (f ? 1 : 0), 14 - (f ? 1 : 0), 4, 7, C.fur); px(22 + (f ? 1 : 0), 13 - (f ? 1 : 0), 3, 3, C.belly);
    // testa (maschera bianca husky)
    px(10, 2, 10, 9, C.belly);
    px(10, 2, 10, 2, C.fur);
    px(10, 4, 1, 5, C.fur); px(19, 4, 1, 5, C.fur);
    px(10, 0, 3, 3, C.dark); px(17, 0, 3, 3, C.dark);
    px(11, 1, 1, 2, C.belly); px(18, 1, 1, 2, C.belly);
    px(12, 4, 1, 2, C.eye); px(16, 4, 1, 2, C.eye);
    px(14, 7, 3, 2, C.nose);
  };
  const sleepFr = (f) => (px) => {
    const b = f ? 1 : 0;
    px(6, 12 - b, 20, 9 + b, C.fur);
    px(6, 12 - b, 15, 5, C.dark);
    px(11, 15 - b, 10, 4, C.belly);
    // testa
    px(18, 8 - b, 10, 8, C.belly);
    px(18, 8 - b, 4, 8, C.fur);
    px(18, 5 - b, 3, 4, C.dark); px(24, 5 - b, 3, 4, C.dark);
    px(21, 11 - b, 2, 1, C.dark); px(24, 11 - b, 2, 1, C.dark);
    px(5, 17, 15, 4, C.fur); px(4, 18, 4, 3, C.belly);
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
  /* traccia segreta Shadow Realm: synthwave oscura e rallentata */
  const DARK_TRK = {
    name: "Anomalia Temporale", bpm: 58, type: "sawtooth",
    lead: [45, 0, 0, 48, 0, 0, 44, 0, 45, 0, 0, 51, 0, 0, 50, 0],
    bass: [21, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 19, 0, 0, 0],
  };
  let mTimer = null, mNext = 0, mStep = 0, mIdx = -1, mDark = false;
  const stopTimer = () => { if (mTimer) { clearInterval(mTimer); mTimer = null; } };
  const musicStop = () => { mIdx = -1; if (!mDark) stopTimer(); };
  const startTimer = () => {
    const c = ensure(); if (!c || mTimer) return;
    mNext = c.currentTime + 0.1; mStep = 0;
    mTimer = setInterval(() => {
      if (muted || !ac || (mIdx < 0 && !mDark)) return;
      const tr = mDark ? DARK_TRK : MTRK[mIdx];
      const spb = 60 / tr.bpm / 4;
      while (mNext < ac.currentTime + 0.3) {
        const i = mStep % 16;
        const dl = Math.max(0, mNext - ac.currentTime);
        if (tr.lead[i]) tone({ f: m2f(tr.lead[i]), type: tr.type, dur: mDark ? 0.5 : 0.16, vol: tr.type === "sawtooth" ? 0.022 : 0.032, delay: dl });
        if (tr.bass[i]) tone({ f: m2f(tr.bass[i]), type: "triangle", dur: mDark ? 0.7 : 0.3, vol: 0.05, delay: dl });
        if (i % 4 === 2) noise({ dur: 0.025, freq: mDark ? 2400 : 6200, vol: 0.012, delay: dl });
        mNext += spb; mStep++;
      }
    }, 110);
  };
  const musicToggle = () => {
    if (muted || mDark) return null;
    const c = ensure(); if (!c) return null;
    mIdx++;
    if (mIdx >= MTRK.length) { musicStop(); return null; }
    startTimer();
    return MTRK[mIdx].name;
  };
  /* on=true: la chiptune si interrompe e parte la dark wave */
  const musicShadow = (on) => {
    if (on) { mDark = true; mIdx = -1; startTimer(); }
    else { mDark = false; if (mIdx < 0) stopTimer(); }
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
    musicShadow,
    /* — nuovi effetti — */
    interference() {
      for (let i = 0; i < 5; i++) noise({ dur: 0.09, freq: 900 + Math.random() * 2600, vol: 0.16, delay: i * 0.07 });
      tone({ f: 1800, f2: 120, type: "sawtooth", dur: 0.4, vol: 0.05, delay: 0.1 });
    },
    alarm() {
      tone({ f: 880, type: "square", dur: 0.14, vol: 0.07 });
      tone({ f: 660, type: "square", dur: 0.14, vol: 0.07, delay: 0.16 });
    },
    shuffle() { for (let i = 0; i < 3; i++) noise({ dur: 0.07, freq: 2400, vol: 0.12, delay: i * 0.09 }); },
    snap() { noise({ dur: 0.03, freq: 3200, vol: 0.14 }); tone({ f: 1600, type: "square", dur: 0.03, vol: 0.05 }); },
    riser(k) { tone({ f: 240 * Math.pow(2, k / 5), type: "triangle", dur: 0.12, vol: 0.08 }); },
    reveal(rarLevel) {
      /* jingle crescente: più la carta è rara, più note */
      const base = [659, 784, 988, 1319];
      for (let i = 0; i <= rarLevel; i++) tone({ f: base[i], type: "triangle", dur: 0.14, vol: 0.1, delay: i * 0.09 });
      if (rarLevel >= 3) tone({ f: 1760, dur: 0.5, vol: 0.08, delay: 0.4 });
    },
    whoosh() { noise({ dur: 0.3, freq: 600, vol: 0.14 }); tone({ f: 200, f2: 900, type: "sine", dur: 0.3, vol: 0.07 }); },
    purr() { for (let i = 0; i < 7; i++) tone({ f: 78 + (i % 2) * 8, type: "sawtooth", dur: 0.07, vol: 0.035, delay: i * 0.07 }); },
    meow() { tone({ f: 740, f2: 990, type: "triangle", dur: 0.13, vol: 0.06 }); tone({ f: 990, f2: 600, type: "triangle", dur: 0.22, vol: 0.055, delay: 0.12 }); },
    bark() {
      tone({ f: 380, f2: 480, type: "triangle", dur: 0.09, vol: 0.08 });
      tone({ f: 480, f2: 220, type: "triangle", dur: 0.14, vol: 0.07, delay: 0.07 });
      noise({ dur: 0.1, freq: 1100, vol: 0.08 });
    },
    pant() {
      for (let i = 0; i < 3; i++) {
        noise({ dur: 0.05, freq: 1500, vol: 0.02, delay: i * 0.12 });
      }
    },
    ding() { tone({ f: 784, type: "triangle", dur: 0.4, vol: 0.12 }); tone({ f: 659, type: "triangle", dur: 0.55, vol: 0.1, delay: 0.26 }); },
    dispose() { mDark = false; musicStop(); stopTimer(); try { ac && ac.close(); } catch (e) { /* noop */ } ac = null; },
  };
}

/* ========================== 7. GAME CORE =============================== */

const DEFAULT_CAM = { x: WW / 2, y: WH / 2 + 6, z: 1 };

function createGame(canvas, wrap, apiRef, dbg, opts = {}) {
  const ctx = canvas.getContext("2d");
  const stats = opts.stats || { giocati: 12, vinti: 7 };
  const posters = opts.posters || null;   // { week: card, ban: card } per i poster dinamici
  let phase = dayPhase();
  let bg = buildBackground(phase, stats, posters);
  const F = buildFurniture();
  const catSp = buildCat();
  const dogSp = buildDog();
  let boardSp = buildBoard(false);
  let bracketOn = false;
  let currentLook = { ...DEFAULT_LOOK };
  let avatar = buildAvatar(currentLook);     // ricostruito quando si cambia look allo specchio
  const sfx = makeAudio();
  const world = mkCanvas(WW, WH);
  const wctx = world.getContext("2d");
  wctx.imageSmoothingEnabled = false;
  let fx = opts.fx || getFxFlags("high");

  /* — tile bloccati e entità (let: scambiati in changeRoom) — */
  let blocked = new Set();
  FURN.forEach((f) => f.tiles.forEach(([x, y]) => blocked.add(tkey(x, y))));

  let sprMap = {
    desk: outlined(F.desk), cam: outlined(F.cam), cam2: outlined(F.camB), chair: outlined(F.chair),
    table: outlined(F.table), stool: outlined(F.stool), stool2: null, lamp: outlined(F.lamp),
  };
  sprMap.stool2 = sprMap.stool;
  const plantFrames = F.plant.map((p) => outlined(p));
  const turnFrames = F.turn.map((p) => outlined(p));

  let entities = FURN.map((f) => {
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

  let inter = {};
  for (const [id, def] of Object.entries(INTERACTIVES)) inter[id] = { id, ...def };
  const rectOf = (e) => {
    const spr = e.frames ? e.frames[0] : e.spr;
    return { x: e.anchor.x - spr.ax, y: e.anchor.y - spr.ay, w: spr.cv.width, h: spr.cv.height };
  };
  inter.pc.hitRect = rectOf(entities.find((e) => e.key === "desk"));
  inter.decks.hitRect = rectOf(entities.find((e) => e.key === "table"));
  inter.board.hitRect = { x: boardSp.wx, y: boardSp.wy, w: boardSp.cv.width, h: boardSp.cv.height * 0.64 };
  // canvas sorgente per l'hit-test pixel-preciso (l'area cliccabile segue la sagoma reale)
  inter.pc.hitCv = (entities.find((e) => e.key === "desk").spr || {}).cv || null;
  inter.decks.hitCv = (entities.find((e) => e.key === "table").spr || {}).cv || null;
  inter.board.hitCv = boardSp.cv;

  /* — Hit-test pixel-preciso ——————————————————————————————————————————————
     Il rettangolo dello sprite include il padding trasparente: cliccando vicino
     a un oggetto si "beccava" l'oggetto sbagliato (es. la sedia al posto del PC).
     Qui leggiamo l'alfa reale del pixel: l'area cliccabile coincide con la sagoma.
     La maschera viene letta una volta e messa in cache sul canvas.            */
  const HIT_ALPHA = 24; // ignora i bordi anti-alias semi-trasparenti
  function spriteMask(cv) {
    if (cv._hitMask !== undefined) return cv._hitMask;
    let mask = null;
    try {
      const data = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
      mask = { w: cv.width, h: cv.height, data };
    } catch (e) {
      mask = null; // canvas non leggibile → fallback al rettangolo
    }
    cv._hitMask = mask;
    return mask;
  }
  function solidInRect(w, r, cv) {
    if (!(w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h)) return false;
    if (!cv) return true;
    const m = spriteMask(cv);
    if (!m || !m.data) return true; // fallback: comportamento a rettangolo
    const px = Math.floor(w.x - r.x);
    const py = Math.floor(w.y - r.y);
    if (px < 0 || py < 0 || px >= m.w || py >= m.h) return false;
    return m.data[(py * m.w + px) * 4 + 3] >= HIT_ALPHA;
  }

  let sils = {
    pc: makeSil(sprMap.desk),
    decks: makeSil(sprMap.table),
    board: makeSil({ cv: boardSp.cv }),
  };

  /* — porta Sala Arcade: disegnata nel background, hitRect statico — */
  inter.door.hitRect = { x: wallR(5.0, 88).x, y: wallR(5.0, 88).y, w: wallR(6.5, 88).x - wallR(5.0, 88).x, h: wallR(5.0, 40).y - wallR(5.0, 88).y + 8 };
  inter.door.hitCv = null;

  /* ====================== SALA ARCADE — dati stanza ====================== */
  const arcadeBg = buildArcadeBackground();
  const arcadeF = buildArcadeFurniture();
  const arcadeBlocked = new Set();
  FURN_ARCADE.forEach((f) => f.tiles.forEach(([x, y]) => arcadeBlocked.add(tkey(x, y))));
  const arcadeSprMap = {
    cabinet1: outlined(arcadeF.cabinet1), cabinet2: outlined(arcadeF.cabinet2),
    cabinet3: outlined(arcadeF.cabinet3), kakeTable: outlined(arcadeF.kakeTable),
    sofa: outlined(arcadeF.sofa), ticket: outlined(arcadeF.ticket), popcorn: outlined(arcadeF.popcorn),
  };
  const arcadeEntities = FURN_ARCADE.map((f) => {
    const xs = f.tiles.map((t) => t[0]), ys = f.tiles.map((t) => t[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const anchor = tileTop(minX, minY);
    return {
      key: f.key, inter: f.inter || null, minX, maxX, minY, maxY, anchor,
      spr: arcadeSprMap[f.key], frames: null,
    };
  });
  const arcadeInter = {};
  for (const [id, def] of Object.entries(INTERACTIVES_ARCADE)) arcadeInter[id] = { id, ...def };
  const arcRectOf = (k) => { const e = arcadeEntities.find((x) => x.key === k); const s = e.spr; return { x: e.anchor.x - s.ax, y: e.anchor.y - s.ay, w: s.cv.width, h: s.cv.height }; };
  arcadeInter.arcade1.hitRect = arcRectOf("cabinet1"); arcadeInter.arcade1.hitCv = arcadeSprMap.cabinet1.cv;
  arcadeInter.arcade2.hitRect = arcRectOf("cabinet2"); arcadeInter.arcade2.hitCv = arcadeSprMap.cabinet2.cv;
  arcadeInter.arcade3.hitRect = arcRectOf("cabinet3"); arcadeInter.arcade3.hitCv = arcadeSprMap.cabinet3.cv;
  arcadeInter.kakegurui.hitRect = arcRectOf("kakeTable"); arcadeInter.kakegurui.hitCv = arcadeSprMap.kakeTable.cv;
  arcadeInter.doorBack.hitRect = { x: 178, y: 134, w: 28, h: 52 };
  arcadeInter.doorBack.hitCv = null;
  const arcadeSils = {
    arcade1: makeSil(arcadeSprMap.cabinet1, "#05d9e8"),
    arcade2: makeSil(arcadeSprMap.cabinet2, "#39ff14"),
    arcade3: makeSil(arcadeSprMap.cabinet3, "#b026ff"),
    kakegurui: makeSil(arcadeSprMap.kakeTable, "#ff2a6d"),
    doorBack: null,
  };
  const arcadeBoardSp = { cv: mkCanvas(1, 1), wx: 0, wy: 0 };

  let tourData = null;  // snapshot dei binding Sala Tornei quando si entra in arcade

  function changeRoom(target) {
    if (st.transition) return;
    st.transition = { t: 0, target, swapped: false };
    st.lock = true;
    st.pending = null;
    st.av.queue = []; st.av.to = null; st.av.seated = false;
    st.modal = null;
    if (apiRef.current.closeModal) apiRef.current.closeModal();
  }

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
  const findEnt = (k) => entities.find((e) => e.key === k);
  const spriteCvOf = (e) => (e ? (e.frames ? e.frames[0].cv : e.spr ? e.spr.cv : null) : null);
  const eggs = [
    { key: "plant", rect: rectOf(findEnt("plant")), cv: spriteCvOf(findEnt("plant")) },
    { key: "lamp", rect: rectOf(lampEnt), cv: spriteCvOf(lampEnt) },
    { key: "cam", rect: rectOf(findEnt("cam")), cv: spriteCvOf(findEnt("cam")) },
    { key: "cam2", rect: rectOf(findEnt("cam2")), cv: spriteCvOf(findEnt("cam2")) },
    { key: "chair", rect: rectOf(findEnt("chair")), cv: spriteCvOf(findEnt("chair")) },
    { key: "stool", rect: rectOf(findEnt("stool")), cv: spriteCvOf(findEnt("stool")) },
    { key: "stool", rect: rectOf(findEnt("stool2")), cv: spriteCvOf(findEnt("stool2")) },
    { key: "window", rect: rectFromPts([wallL(7.7, 92), wallL(5.7, 92), wallL(5.7, 24), wallL(7.7, 24)]) },
    { key: "posterBrand", rect: rectFromPts([wallL(1.0, 96), wallL(2.7, 96), wallL(2.7, 48), wallL(1.0, 48)]) },
    { key: "mirror", rect: rectFromPts([wallL(8.05, 98), wallL(9.85, 98), wallL(9.85, 10), wallL(8.05, 10)]) },
    { key: "stats", rect: rectFromPts([wallL(3.3, 88), wallL(4.7, 88), wallL(4.7, 50), wallL(3.3, 50)]) },
  ];
  if (posters && posters.week) eggs.push({ key: "posterWeek", rect: rectFromPts([wallR(0.55, 92), wallR(1.6, 92), wallR(1.6, 42), wallR(0.55, 42)]) });
  if (posters && posters.ban) eggs.push({ key: "posterBan", rect: rectFromPts([wallR(1.8, 92), wallR(2.85, 92), wallR(2.85, 42), wallR(1.8, 42)]) });

  /* — punto sul piano del tavolo (z=22 sopra il pavimento) — */
  const tablePt = (tx, ty) => { const p = tileTop(tx, ty); return { x: p.x, y: p.y + HTH - 22 }; };
  const CAT_PERCH_SPOTS = {
    chair: { approach: { cx: 2, cy: 4 }, tx: 1.0, ty: 4.0, lift: 21, land: { cx: 2, cy: 4 }, dir: "nw", state: "sit" },
    table: { approach: { cx: 7, cy: 5 }, tx: 7.05, ty: 3.28, lift: 22, land: { cx: 7, cy: 5 }, dir: "sw", state: "sit" },
    desk: { approach: { cx: 1, cy: 5 }, tx: 0.45, ty: 4.42, lift: 27, land: { cx: 1, cy: 5 }, dir: "se", state: "sleep" },
  };
  /* — centro dello schermo del PC (per lo zoom della Sequenza di Hype) — */
  const scrCenter = {
    x: (screenQuad[0].x + screenQuad[2].x) / 2,
    y: (screenQuad[0].y + screenQuad[2].y) / 2,
  };
  /* — busta lettere: scivola dalla porta sul pavimento — */
  const LETTER_START = (() => {
    const p = tileTop(10.2, 7.2);
    return { x: p.x + 18, y: p.y + HTH - 8 };
  })();
  const LETTER_REST = (() => {
    const p = tileTop(9.8, 8.0);
    return { x: p.x, y: p.y + HTH - 4 };
  })();
  const letterHitRect = (lt) => ({ x: lt.x - 14, y: lt.y - 18, w: 28, h: 20 });

  /* — stato — */
  const tutDone = typeof localStorage !== "undefined" && localStorage.getItem("irg-tutorial-done") === "1";
  const st = {
    t: 0, last: 0, raf: 0, destroyed: false,
    room: "tournament", transition: null,
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
    tut: { active: !tutDone, i: 0, phase: "init", t: 0, announced: false }, // tutorial guidato (una volta sola)
    keys: new Set(), lastKey: null,
    /* nuove feature */
    fx: [],                       // particelle (cuori, zzz, note, scintille)
    alert: 0,                     // glow d'allerta sul PC fino a t=alert
    ring: null,                   // { until } citofono che suona
    ringTest: null,               // timer del test citofono
    eggCd: 0,                     // cooldown easter egg
    lastAct: 0, afk: false, afkGoing: false, afkShuffle: null, afkShuffleGoing: false, shake: 0,
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
      perch: null,                   // { key, tx, ty, lift, until } gatta sugli arredi
      streak: 0, lastPet: -99,       // carezze consecutive (per lo Shadow Realm)
      pendingChairAt: null,          // timer per ritardare la salita sulla sedia
    },
    dog: {
      from: { cx: 5, cy: 7 }, to: null, t: 0, fx: 5, fy: 7, queue: [],
      dir: "se", state: "sleep", until: 6 + Math.random() * 8, goal: null,
      pets: 0, follow: 0, nextZ: 0,
      perch: null,
      streak: 0, lastPet: -99,
      pendingChairAt: null,
    },
    petInteraction: null,            // { type: "chase"|"fight", stage: number, t0: number, runnerTarget?: {cx, cy}, until?: number }
    nextPetInteraction: 60 + Math.random() * 60, // primo check dopo 60-120s
    cinematic: false,                // input bloccato durante le sequenze
    chairSpin: -99,                  // t dell'ultima "girata" della sedia
    scatter: [],                     // carte sparpagliate sul tavolo (fisica con attrito)
    shadow: null,                    // { until } modalità Shadow Realm
    matrix: [],                      // colonne della pioggia digitale alla finestra
    letterNextAt: 40 + Math.random() * 10, // busta lettere ogni 40-50s
    letter: null,                    // busta attiva / sequenza ricompensa crediti
    letterFx: [],                    // particelle confetti (screen-space)
    hype: null,                      // sequenza di hype pre-match in corso
    pointer: { x: 0.5, y: 0.5 },     // mouse normalizzato (riflessi olografici)
  };
  for (let i = 0; i < 14; i++) {
    st.motes.push({ u: Math.random(), v: Math.random(), sp: 0.03 + Math.random() * 0.05, ph: Math.random() * 6.28, lift: 8 + Math.random() * 48 });
  }
  // ingresso in scena
  st.av.queue = findPath({ cx: 10, cy: 9 }, { cx: 5, cy: 6 }, blocked) || [];

  const letterOverlayActive = () =>
    st.letter && ["lift", "open", "reveal", "done"].includes(st.letter.phase);

  /* — camera — */
  const camTo = (to, dur, cb) => {
    st.cam.tween = { fx: st.cam.x, fy: st.cam.y, fz: st.cam.z, tx: to.x, ty: to.y, tz: to.z, t: 0, dur: fx.cssAnimations ? dur : dur * 0.35, cb };
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
  const showBubble = (text, dur, target) => { st.bubble = { text, t0: st.t, dur, target }; };
  const hideHintOnce = () => {
    if (!st.hintHidden) { st.hintHidden = true; apiRef.current.hideHint && apiRef.current.hideHint(); }
  };

  function startInteract(o) {
    if (o.action === "changeRoom") { changeRoom(o.target); return; }
    st.lock = true;
    if (o.id === "pc") st.alert = 0; // il giocatore ha visto la notifica
    const t = st.av.from;
    if (o.faceTile) {
      const dx = o.faceTile[0] - t.cx, dy = o.faceTile[1] - t.cy;
      st.av.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? "se" : "nw") : (dy >= 0 ? "sw" : "ne");
    } else st.av.dir = "ne";
    const dcam = st.room === "arcade" ? ARC_DEFAULT_CAM : DEFAULT_CAM;
    const fx = lerp(o.focus.x, dcam.x, 0.2), fy = lerp(o.focus.y, dcam.y, 0.2);
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

  /* Tasti 1/2/3: "teletrasporto" all'oggetto e apertura immediata della modale,
     senza far camminare l'avatar (interazione veloce). Lo posiziona sul tile di
     approccio così, alla chiusura, riparte da un punto coerente. */
  function teleportInteract(o) {
    st.av.queue = [];
    st.av.to = null;
    st.pending = null;
    st.sitTarget = false;
    const ap = (o.approach && o.approach[0]) || null;
    if (ap) {
      st.av.from = { cx: ap[0], cy: ap[1] };
      st.av.fx = ap[0];
      st.av.fy = ap[1];
    }
    startInteract(o);
  }

  /* Specchio: apre direttamente la modale di personalizzazione (niente cammino). */
  function openMirror() {
    sfx.open();
    st.pending = null;
    st.sitTarget = false;
    st.modal = "mirror";
    st.lock = false;
    if (apiRef.current.openModal) apiRef.current.openModal("mirror");
  }

  /* ====================== TUTORIAL GUIDATO ====================== */
  const avIdle = () => !st.av.to && !st.av.queue.length && !st.lock && !st.cam.tween;
  const tutCaption = (text) => {
    if (apiRef.current.setTutorialCaption) apiRef.current.setTutorialCaption(text || null);
  };
  const tutIntro = (on) => {
    if (apiRef.current.setTutorialIntro) apiRef.current.setTutorialIntro(!!on);
  };
  const tutOutro = (on) => {
    if (apiRef.current.setTutorialOutro) apiRef.current.setTutorialOutro(!!on);
  };
  function tutSay(text) {
    showBubble(text, 999);
    if (st.bubble) st.bubble.sticky = true;
    tutCaption(text);
  }
  function tutBeginStep() {
    const T = st.tut, step = TUT_STEPS[T.i];
    if (!step) { tutShowOutro(); return; }
    T.t = 0;
    if (step.intro) {
      // saluto grande al centro: niente fumetto sull'omino, solo il cartello centrale
      tutIntro(true);
      tutCaption(step.text);
      if (st.bubble) st.bubble = null;
    } else if (step.kind === "keys") {
      tutIntro(false);
      tutCaption(step.text);
      if (st.bubble) st.bubble = null;
      if (st.modal && apiRef.current.closeModal) apiRef.current.closeModal();
      st.modal = null;
      if (apiRef.current.setTutorialUiSpot) apiRef.current.setTutorialUiSpot(step.id);
    } else {
      tutIntro(false);              // la barra "vola" in alto e prosegue
      tutSay(step.text);
    }
    if (step.kind === "say") {
      T.phase = "say";
    } else if (step.kind === "keys") {
      T.phase = "keys";
    } else {
      T.phase = "walk";
      clickObject(inter[step.id]);   // riusa tutta la coreografia (cammina, siede al PC, apre)
    }
  }
  function tutAdvance() {
    if (apiRef.current.setTutorialUiSpot) apiRef.current.setTutorialUiSpot(null);
    st.tut.i++; tutBeginStep();
  }
  function tutTick(dt) {
    const T = st.tut;
    if (!T.active) return;
    if (!T.announced) {
      T.announced = true;
      st.cinematic = true;                                   // blocca l'input manuale
      if (apiRef.current.setTutorial) apiRef.current.setTutorial(true);
      tutIntro(true);                                        // il banner nasce già grande al centro
    }
    if (T.phase === "init") {                                // aspetta che finisca l'ingresso in scena
      if (avIdle()) tutBeginStep();
      return;
    }
    if (T.phase === "outro") return;                         // cartello finale: aspetta la scelta dell'utente
    const step = TUT_STEPS[T.i];
    if (!step) { tutShowOutro(); return; }
    T.t += dt;
    if (step.kind === "say") {
      const need = step.dur ?? tutCaptionSec(step.text, { intro: !!step.intro });
      if (T.t >= need) tutAdvance();
      return;
    }
    if (step.kind === "keys") {
      if (T.t >= tutUiHoldSec(step)) tutAdvance();
      return;
    }
    /* kind "demo" */
    if (T.phase === "walk") {
      const captionDone = T.t >= tutCaptionSec(step.text);
      // modale aperta ma frase esterna ancora in corso: non tagliare il cartello
      if (st.modal === step.id && captionDone) {
        T.phase = "hold"; T.t = 0;
        // modale aperta: spiega cosa farci dentro. Solo la barra in alto (il
        // fumetto sull'omino sarebbe coperto dalla modale), niente bolla residua.
        if (step.inside) { tutCaption(step.inside); st.bubble = null; }
      }
      else if (T.t > 14) { startInteract(inter[step.id]); }   // safety: forza l'apertura se il path è bloccato
      return;
    }
    if (T.phase === "hold") {
      if (T.t >= tutHoldSec(step)) {
        T.phase = "close"; T.t = 0;
        if (apiRef.current.closeModal) apiRef.current.closeModal();
        else { st.modal = null; }
      }
      return;
    }
    if (T.phase === "close") {
      if ((st.modal === null && avIdle()) || T.t > 7) tutAdvance(); // attende chiusura + ritorno avatar
      return;
    }
  }
  /* Cartello finale: si ri-ingrandisce al centro e mostra i bottoni di scelta.
     L'input resta bloccato (st.cinematic) finché l'utente non sceglie. */
  function tutShowOutro() {
    const T = st.tut;
    T.phase = "outro";
    T.t = 0;
    st.cinematic = true;
    st.sitTarget = false;
    st.pending = null;
    if (st.modal && apiRef.current.closeModal) apiRef.current.closeModal();
    st.modal = null;
    if (st.bubble) st.bubble = null;
    tutIntro(true);            // ri-ingrandisce il pop-up
    if (apiRef.current.setTutorialUiSpot) apiRef.current.setTutorialUiSpot(null);
    tutCaption(TUT_OUTRO);     // testo che si "scrive" lato React
    tutOutro(true);            // mostra i bottoni di scelta
  }
  /* "Ripeti tutorial? Sì": ricomincia da capo. */
  function tutRestart() {
    st.tut = { active: true, i: 0, phase: "init", t: 0, announced: true };
    st.cinematic = true;
    st.modal = null;
    st.pending = null;
    st.sitTarget = false;
    if (st.bubble) st.bubble = null;
    tutOutro(false);
    tutCaption(null);
    tutIntro(true);
    if (apiRef.current.setTutorialUiSpot) apiRef.current.setTutorialUiSpot(null);
    if (apiRef.current.setTutorial) apiRef.current.setTutorial(true);
  }
  function endTutorial() {
    const T = st.tut;
    if (!T.active) return;
    T.active = false;
    st.cinematic = false;
    st.introDone = true;
    st.lastAct = st.t;
    st.pending = null;
    st.sitTarget = false;
    if (st.bubble) st.bubble.sticky = false;                 // lascia svanire la battuta corrente
    if (st.modal && apiRef.current.closeModal) apiRef.current.closeModal(); // caso "Salta" a modale aperta
    tutCaption(null);
    tutIntro(false);
    tutOutro(false);
    if (apiRef.current.setTutorial) apiRef.current.setTutorial(false);
    showBubble("Tocca a te! 🎮", 3);
    try { localStorage.setItem("irg-tutorial-done", "1"); } catch (e) {}
  }

  function hitObject(sx, sy) {
    const w = unproject(sx, sy);
    for (const id of Object.keys(inter)) {
      if (solidInRect(w, inter[id].hitRect, inter[id].hitCv)) return inter[id];
    }
    return null;
  }

  /* — helper feature nuove — */
  const inRect = (w, r) => w.x >= r.x && w.x <= r.x + r.w && w.y >= r.y && w.y <= r.y + r.h;
  const ALWAYS_FX = new Set(["heart"]);
  const spawnFx = (kind, x, y, n = 1) => {
    if (!fx.particles && !ALWAYS_FX.has(kind)) return;
    const DEF = {
      heart: { ch: "♥", col: "#ff6b8a", size: 9, rise: 26, dur: 1.3 },
      zzz: { ch: "z", col: "#cfd6f5", size: 9, rise: 22, dur: 1.8 },
      note: { ch: "♪", col: "#ffd76e", size: 10, rise: 30, dur: 1.6 },
      spark: { ch: "✦", col: "#ffe9b0", size: 9, rise: 24, dur: 1.2 },
      dust: { ch: "💨", col: "#d4d8e5", size: 10, rise: 15, dur: 0.8 },
      clash: { ch: "💥", col: "#ffb454", size: 11, rise: 18, dur: 0.6 },
    };
    const d = DEF[kind];
    for (let i = 0; i < n; i++) {
      st.fx.push({ ...d, x: x + (Math.random() - 0.5) * 14, y: y - Math.random() * 6, t0: st.t + i * 0.12, ph: Math.random() * 6.28 });
    }
  };

  function petFootPoint(pet) {
    if (pet.perch) {
      const p = tileTop(pet.perch.tx, pet.perch.ty);
      return {
        x: p.x + (pet.perch.ox || 0),
        y: p.y + HTH - pet.perch.lift + (pet.perch.oy || 0),
        perched: true,
      };
    }
    const p = tileTop(pet.fx, pet.fy);
    return { x: p.x, y: p.y + HTH, perched: false };
  }

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
    if (st.letter && st.letter.phase === "idle" && inRect(w, letterHitRect(st.letter))) return { kind: "letter" };
    if (solidInRect(w, turnRect, turnFrames[0] && turnFrames[0].cv)) return { kind: "music" };
    if (inRect(w, intercomRect)) return { kind: "intercom" };
    // gatto: cerchio attorno alla sua posizione (anche quando è appollaiata)
    const cp = petFootPoint(st.cat);
    if (Math.abs(w.x - cp.x) < 18 && Math.abs(w.y - (cp.y - 8)) < 16) return { kind: "cat" };
    // cane Cookie
    const d_cp = petFootPoint(st.dog);
    if (Math.abs(w.x - d_cp.x) < 22 && Math.abs(w.y - (d_cp.y - 8)) < 20) return { kind: "dog" };
    for (const eg of eggs) if (eg.cv ? solidInRect(w, eg.rect, eg.cv) : inRect(w, eg.rect)) return { kind: "egg", egg: eg };
    return null;
  }

  /* — Shadow Realm — */
  function enterShadow() {
    st.shadow = { until: st.t + 60, t0: st.t };
    sfx.interference();
    sfx.musicShadow(true);
    st.matrix = [];
    for (let i = 0; i < 14; i++) {
      st.matrix.push({ u: Math.random(), y: Math.random(), sp: 0.25 + Math.random() * 0.5 });
    }
    // Inizializza le carte caotiche sullo sfondo dello Shadow Realm
    const { w, h } = st.view;
    st.shadowCards = [];
    for (let i = 0; i < 24; i++) {
      st.shadowCards.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 60 - 20, // drift leggermente verso sinistra/alto
        vy: (Math.random() - 0.5) * 60 + 10,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 1.5,
        scale: 0.45 + Math.random() * 0.45,
        type: "brx",
        col: ["#a855f7", "#6366f1", P.gold, "#ec4899", "#14b8a6", "#22c55e", "#ef4444", "#f97316", "#06b6d4", "#f43f5e", "#3b82f6"][Math.floor(Math.random() * 11)]
      });
    }
    showBubble("🌌 …Qualcosa si è incrinato. Benvenuta nel Reame.", 4);
  }
  function exitShadow() {
    st.shadow = null;
    st.shadowCards = null;
    sfx.musicShadow(false);
    sfx.interference();
    showBubble("Tutto torna normale. …Per ora.", 3);
  }

  function petCat() {
    const cat = st.cat;
    sfx.purr();
    const cp = petFootPoint(cat);
    spawnFx("heart", cp.x, cp.y - 8, 3);
    if (cat.state === "sleep") { cat.state = "sit"; cat.until = st.t + 4; }
    cat.pets++;
    
    let isPendingChair = false;
    // Se viene accarezzata mentre è a terra, prenota il salto sulla sedia dopo un breve ritardo
    // per non interrompere la catena di carezze dell'easter egg
    if (!cat.perch && !cat.to) {
      cat.pendingChairAt = st.t + 1.5;
      isPendingChair = true;
    }
    
    /* easter egg segreto: 7 carezze di fila, musica spenta, a notte fonda */
    cat.streak = st.t - cat.lastPet < 5 ? cat.streak + 1 : 1;
    cat.lastPet = st.t;
    if (cat.streak >= 7 && !st.shadow && !sfx.musicOn() && phase.id === "night") {
      cat.streak = 0;
      cat.pendingChairAt = null;
      enterShadow();
      return;
    }
    if (cat.pets % 3 === 0) {
      // Evitiamo di sovrascrivere l'azione forzata della sedia se sta per partire
      if (!cat.forceChair && !isPendingChair) {
        cat.follow = 6;
        sfx.meow();
        showBubble(st.shadow ? "Missy vede oltre il velo… e ti segue. 🐈‍⬛" : "Missy ti segue! 🐱", 2.6);
      }
    }
  }

  function petDog() {
    const dog = st.dog;
    sfx.pant();
    const cp = petFootPoint(dog);
    spawnFx("heart", cp.x, cp.y - 8, 3);
    if (dog.state === "sleep") { dog.state = "sit"; dog.until = st.t + 4; }
    dog.pets++;
    
    let isPendingChair = false;
    if (!dog.perch && !dog.to) {
      dog.pendingChairAt = st.t + 1.5;
      isPendingChair = true;
    }
    
    if (dog.pets % 3 === 0) {
      if (!dog.forceChair && !isPendingChair) {
        dog.follow = 6;
        sfx.bark();
        showBubble("Cookie ti segue scodinzolando! 🐶", 2.6);
      }
    }
  }

  function eggClick(eg) {
    if (st.t < st.eggCd) return;
    st.eggCd = st.t + 1;
    sfx.click();
    /* nello Shadow Realm tutte le battute diventano profetiche */
    if (st.shadow) {
      showBubble(SHADOW_LINES[Math.floor(Math.random() * SHADOW_LINES.length)], 3.2);
      return;
    }
    let key = eg.key;
    if (key === "window" && phase.id === "night") key = "windowNight";
    let lines = EGG_LINES[key] || EGG_LINES.window;
    if (eg.key === "stats") {
      const wr = stats.giocati ? Math.round((stats.vinti / stats.giocati) * 100) : 0;
      lines = ["🏅 " + stats.vinti + " vittorie su " + stats.giocati + " tornei · WR " + wr + "%"];
    } else if (eg.key === "posterWeek" && posters && posters.week) {
      lines = ["⭐ «" + posters.week.nome + "»: " + WEEK_LINES[Math.floor(Math.random() * WEEK_LINES.length)]];
    } else if (eg.key === "posterBan" && posters && posters.ban) {
      lines = ["🔨 «" + posters.ban.nome + "» — " + BAN_LINES[Math.floor(Math.random() * BAN_LINES.length)]];
    }
    showBubble(lines[Math.floor(Math.random() * lines.length)], 3.2);
  }

  /* — Busta lettere: click sulla busta a terra → ricompensa crediti — */
  function burstLetterFx(cx, cy, n = 24) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;
      st.letterFx.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 30,
        col: Math.random() < 0.65 ? "#F3C76A" : (Math.random() < 0.5 ? "#ffe6a8" : "#ffffff"),
        size: 2 + Math.random() * 3,
        dur: 0.7 + Math.random() * 0.5,
        t0: st.t,
        grav: 45,
      });
    }
  }

  function spawnLetter() {
    if (st.letter || st.modal || st.lock || st.cinematic || st.hype) return;
    const reward = mockCreditReward();
    st.letter = {
      phase: "slide",
      t0: st.t,
      x: LETTER_START.x,
      y: LETTER_START.y,
      rot: -0.14,
      tournamentName: MOCK_TOURNAMENT_NAMES[Math.floor(Math.random() * MOCK_TOURNAMENT_NAMES.length)],
      creditsBefore: reward.creditsBefore,
      creditsEarned: reward.creditsEarned,
      creditsAfter: reward.creditsAfter,
      lastCreditTick: reward.creditsBefore,
    };
    sfx.whoosh();
    showBubble("📬 Qualcuno ha lasciato una lettera alla porta!", 4.5);
  }

  function startLetterOpening() {
    if (!st.letter || st.letter.phase !== "idle" || st.hype || st.modal || st.lock) return;
    sfx.click();
    st.cinematic = true;
    st.letter.phase = "lift";
    st.letter.t0 = st.t;
  }

  function advanceLetterToReveal() {
    const lt = st.letter;
    if (!lt || lt.phase !== "open" || lt.flapBurst) return;
    lt.flapBurst = true;
    lt.phase = "reveal";
    lt.t0 = st.t;
    st.shake = 18;
    sfx.success();
    sfx.open();
    const { w, h } = st.view;
    const cy = h / 2 - 10;
    burstLetterFx(w / 2, cy, 56);
    st.letterFx.push({
      x: w / 2, y: cy,
      ring: true, maxRadius: 120, col: "#F3C76A", dur: 0.75, t0: st.t,
    });
    st.letterFx.push({
      x: w / 2, y: cy,
      ring: true, maxRadius: 180, col: "#F3C76A", dur: 1.0, t0: st.t,
    });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      st.letterFx.push({
        x: w / 2 + Math.cos(a) * 6, y: cy + Math.sin(a) * 4,
        vx: Math.cos(a) * 95, vy: Math.sin(a) * 72 - 44,
        col: i % 2 ? "#F3C76A" : "#ffe6a8",
        size: 3 + Math.random() * 2,
        dur: 0.6 + Math.random() * 0.35,
        t0: st.t,
        grav: 50,
      });
    }
  }

  function closeLetterReward() {
    st.letter = null;
    st.cinematic = false;
    st.letterNextAt = st.t + 40 + Math.random() * 10;
    sfx.click();
  }

  /* — Sequenza di Hype: SFIDANTE TROVATO → shuffle → zoom nel PC — */
  function startHype(opponent) {
    if (st.hype || letterOverlayActive() || st.modal || st.destroyed) return;
    st.cinematic = true;
    st.pending = null; st.sitTarget = false;
    st.afk = false; st.afkGoing = false;
    st.hype = { phase: "alarm", t0: st.t, opp: opponent || "Sfidante", nextBeep: 0, deals: null, puffs: 0 };
    doRing("SFIDANTE TROVATO: " + (opponent || "???") + "! ⚔️");
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
    if (st.shake > 0) {
      st.shake = Math.max(0, st.shake - dt * 26);
    }
    /* — transizione cambio stanza (fade 0.8s, swap al midpoint) — */
    if (st.transition) {
      st.transition.t += dt;
      if (!st.transition.swapped && st.transition.t >= 0.4) {
        st.transition.swapped = true;
        if (st.transition.target === "arcade") {
          tourData = { blocked, sprMap, entities, inter, sils, boardSp };
          bg = arcadeBg; blocked = arcadeBlocked; sprMap = arcadeSprMap;
          entities = arcadeEntities; inter = arcadeInter; sils = arcadeSils;
          boardSp = arcadeBoardSp;
          st.room = "arcade";
          st.av.from = { cx: ARC_ENTRY_TILE.cx, cy: ARC_ENTRY_TILE.cy };
          st.av.fx = ARC_ENTRY_TILE.cx; st.av.fy = ARC_ENTRY_TILE.cy;
        } else {
          bg = buildBackground(phase, stats, posters);
          blocked = tourData.blocked; sprMap = tourData.sprMap; entities = tourData.entities;
          inter = tourData.inter; sils = tourData.sils; boardSp = tourData.boardSp;
          st.room = "tournament";
          st.av.from = { cx: TOUR_ENTRY_TILE.cx, cy: TOUR_ENTRY_TILE.cy };
          st.av.fx = TOUR_ENTRY_TILE.cx; st.av.fy = TOUR_ENTRY_TILE.cy;
        }
        st.av.to = null; st.av.queue = []; st.av.t = 0; st.av.seated = false;
        st.av.dir = "se"; st.av.wt = 0; st.av.stepN = 0;
        st.av.nextBlink = 2.6; st.av.blinkUntil = 0;
        const cam = st.room === "arcade" ? ARC_DEFAULT_CAM : DEFAULT_CAM;
        st.cam.x = cam.x; st.cam.y = cam.y; st.cam.z = cam.z; st.cam.tween = null;
        st.nearObj = null; st.pending = null; st.sitTarget = false; st.standBack = null;
        sfx.open();
        if (apiRef.current.setRoom) apiRef.current.setRoom(st.room);
      }
      if (st.transition.t >= 0.8) { st.transition = null; st.lock = false; }
      return;
    }
    const isTour = st.room === "tournament";
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
    // tutorial guidato (pilota cammino/modali, blocca input via st.cinematic)
    if (isTour && st.tut.active) tutTick(dt);
    // tastiera
    if (!av.to && !av.queue.length && !st.lock && !st.modal && !st.cinematic && st.keys.size) {
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
      if (st.shadow && fx.shadowEffects) {
        if (Math.random() < dt * 16) {
          const ap = tileTop(av.fx, av.fy);
          const shadowLift = Math.sin(st.t * 3.5) * 4 - 5;
          st.fx.push({
            ch: Math.random() < 0.35 ? "✦" : (Math.random() < 0.6 ? "✧" : "•"),
            col: Math.random() < 0.5 ? "#c084fc" : "#818cf8",
            size: 5 + Math.random() * 4,
            rise: 4 + Math.random() * 6,
            dur: 0.6 + Math.random() * 0.4,
            x: ap.x + (Math.random() - 0.5) * 8,
            y: ap.y + HTH + shadowLift + (Math.random() - 0.5) * 6,
            t0: st.t,
            ph: Math.random() * 6.28
          });
        }
      }
      if (av.t >= 1) {
        const carry = av.t - 1;
        av.from = av.to; av.to = null; av.t = 0;
        av.stepN++; sfx.step(av.stepN);
        if (onRug(av.from.cx, av.from.cy) && fx.prints) {
          const fp = tileTop(av.from.cx, av.from.cy);
          st.prints.push({ x: fp.x + (av.stepN % 2 ? 5 : -5), y: fp.y + HTH, t0: st.t, s: 1 });
          if (st.prints.length > 40) st.prints.shift();
        }
        if (av.queue.length && !st.lock) { shiftStep(); av.t = carry; }
        else {
          // arrivo
          if (!st.introDone && !st.tut.active) { st.introDone = true; showBubble("Benvenuto! Prova i tasti: 1 PC · 2 Tavolo · 3 Bacheca 👀", 5); }
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
          } else if (st.afkShuffleGoing) {
            // arrivato al tavolo: inizia lo smazzamento carte AFK
            st.afkShuffleGoing = false;
            st.afkShuffle = { t0: st.t, lastShuffle: 0 };
            av.dir = "ne";
          } else if (st.sitTarget) {
            st.sitTarget = false;
            av.seated = true;
            av.dir = "nw";
            sfx.pin();
            startInteract(inter.pc);
          }
        }
      }
    } else if (!st.introDone && !st.tut.active && st.t > 3) {
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
    if (fx.motes) for (const m of st.motes) { m.v += m.sp * dt * 4; if (m.v > 1) { m.v -= 1; m.u = Math.random(); } }
    // ripples
    st.ripples = st.ripples.filter((r) => st.t - r.t0 < 0.45);
    // bolla (le battute "sticky" del tutorial non svaniscono da sole)
    if (st.bubble && !st.bubble.sticky && st.t - st.bubble.t0 > st.bubble.dur) st.bubble = null;

    /* — idle/AFK: dopo 45s di inattività si va a meditare sul tappeto o a smazzare carte al tavolo — */
    if (isTour && !st.afk && !st.afkGoing && !st.afkShuffle && !st.afkShuffleGoing && !st.modal && !st.lock && !av.seated &&
        !av.to && !av.queue.length && st.t - st.lastAct > 45 && st.introDone && !st.tut.active && !st.cinematic && !st.hype && !letterOverlayActive()) {
      st.pending = null; st.sitTarget = false;
      if (Math.random() < 0.5) {
        if (walkToTile({ cx: 5, cy: 6 })) st.afkGoing = true;
        else st.afk = true; // già lì (o tile occupato): medita sul posto
      } else {
        const t00 = av.to || av.from;
        let best = null;
        for (const [x, y] of inter.decks.approach) {
          const p = findPath(t00, { cx: x, cy: y }, blocked);
          if (p && (!best || p.length < best.length)) best = p;
        }
        if (best && best.length) {
          av.queue = best;
          st.afkShuffleGoing = true;
          shiftStep();
        } else {
          if (walkToTile({ cx: 5, cy: 6 })) st.afkGoing = true;
          else st.afk = true;
        }
      }
    }
    if (st.afk && fx.particles && Math.random() < dt * 0.8) {
      const ap = tileTop(av.fx, av.fy);
      spawnFx(Math.random() < 0.5 ? "spark" : "zzz", ap.x, ap.y - 30);
    }
    if (st.afkShuffle) {
      if (st.t - st.afkShuffle.lastShuffle > 6.0) {
        st.afkShuffle.lastShuffle = st.t;
        sfx.shuffle();
      }
      if (fx.particles && Math.random() < dt * 0.8) {
        const ap = tileTop(av.fx, av.fy);
        spawnFx("spark", ap.x, ap.y - 30);
      }
    }

    /* — test citofono programmato: parte la Sequenza di Hype (mock) — */
    if (st.ringTest && st.t > st.ringTest) {
      st.ringTest = null;
      startHype("Drakmor92");
    }

    /* — ricontrolla la fase del giorno (ogni 30s, solo Sala Tornei) — */
    if (isTour && st.t > st.phaseCheck) {
      st.phaseCheck = st.t + 30;
      const ph = dayPhase();
      if (ph.id !== phase.id) { phase = ph; bg = buildBackground(phase, stats, posters); }
    }

    /* — gatto: stati e movimento — */
    /* — pet interaction check (solo Sala Tornei) — */
    if (isTour && !st.petInteraction && st.t > st.nextPetInteraction) {
      st.nextPetInteraction = st.t + 110 + Math.random() * 90; // tra 1.8 e 3.3 minuti
      const catEligible = !st.cat.perch && st.cat.follow === 0 && (st.t - st.cat.lastPet > 6);
      const dogEligible = !st.dog.perch && st.dog.follow === 0 && (st.t - st.dog.lastPet > 6);
      if (catEligible && dogEligible && Math.random() < 0.6) {
        // iniziamo un inseguimento!
        st.petInteraction = {
          type: "chase",
          stage: 0,
          t0: st.t,
          runner: "cat",
          chaser: "dog"
        };
        // Reset normal states and align positions to grid cells
        st.cat.state = "sit";
        st.cat.to = null;
        st.cat.queue = [];
        st.cat.t = 0;
        st.cat.fx = st.cat.from.cx;
        st.cat.fy = st.cat.from.cy;
        
        st.dog.state = "sit";
        st.dog.to = null;
        st.dog.queue = [];
        st.dog.t = 0;
        st.dog.fx = st.dog.from.cx;
        st.dog.fy = st.dog.from.cy;
      }
    }

    if (isTour && st.petInteraction) {
      const pi = st.petInteraction;
      if (pi.type === "chase") {
        if (pi.stage === 0) {
          if (st.t > pi.t0 + 0.1) {
            sfx.bark();
            showBubble("Cookie: Bau! Ti prendo! 🐶", 2.2, "dog");
            sfx.meow();
            showBubble("Missy: Miao! 🙀", 2.2, "cat");
            pi.stage = 1;
            pi.t0 = st.t + 1.2;
          }
        } else if (pi.stage === 1) {
          if (st.t > pi.t0) {
            // Missy decide dove scappare
            let tgt = null;
            for (let i = 0; i < 15 && !tgt; i++) {
              const x = Math.floor(Math.random() * COLS);
              const y = Math.floor(Math.random() * ROWS);
              if (!blocked.has(tkey(x, y)) && (Math.abs(x - st.dog.from.cx) + Math.abs(y - st.dog.from.cy) > 1)) {
                tgt = { cx: x, cy: y };
              }
            }
            if (!tgt) {
              for (let i = 0; i < 15 && !tgt; i++) {
                const x = Math.floor(Math.random() * COLS);
                const y = Math.floor(Math.random() * ROWS);
                if (!blocked.has(tkey(x, y))) tgt = { cx: x, cy: y };
              }
            }
            if (tgt) {
              const path = findPath(st.cat.from, tgt, blocked);
              if (path && path.length) {
                st.cat.queue = path;
                st.cat.to = st.cat.queue.shift();
                const dx = st.cat.to.cx - st.cat.from.cx, dy = st.cat.to.cy - st.cat.from.cy;
                st.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
                pi.runnerTarget = tgt;
                pi.stage = 2;
              } else {
                pi.type = "fight"; pi.stage = 0; pi.t0 = st.t; pi.until = st.t + 2.8;
              }
            } else {
              pi.type = "fight"; pi.stage = 0; pi.t0 = st.t; pi.until = st.t + 2.8;
            }
          }
        } else if (pi.stage === 2) {
          if (!st.cat.to) {
            showBubble("Scappa! 🐈", 1.5, "cat");
            const path = findPath(st.dog.from, pi.runnerTarget, blocked);
            if (path && path.length) {
              st.dog.queue = path;
              st.dog.to = st.dog.queue.shift();
              const dx = st.dog.to.cx - st.dog.from.cx, dy = st.dog.to.cy - st.dog.from.cy;
              st.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
              pi.stage = 3;
            } else {
              pi.type = "fight"; pi.stage = 0; pi.t0 = st.t; pi.until = st.t + 2.8;
            }
          }
        } else if (pi.stage === 3) {
          if (!st.dog.to) {
            pi.type = "fight";
            pi.stage = 0;
            pi.t0 = st.t;
            pi.until = st.t + 2.8;
            sfx.bark();
            sfx.meow();
            showBubble("Zuffa! 💥", 2.0, "cat");
            showBubble("Bau! 💨", 2.0, "dog");
          }
        }
      } else if (pi.type === "fight") {
        st.cat.state = "sit";
        st.dog.state = "sit";
        const dx = st.dog.from.cx - st.cat.from.cx;
        const dy = st.dog.from.cy - st.cat.from.cy;
        st.cat.fx = st.cat.from.cx + Math.sin(st.t * 35) * 0.15;
        st.cat.fy = st.cat.from.cy + Math.cos(st.t * 30) * 0.15;
        st.dog.fx = st.cat.from.cx + (dx * 0.5) + Math.sin(st.t * 32 + 1.2) * 0.15;
        st.dog.fy = st.cat.from.cy + (dy * 0.5) + Math.cos(st.t * 28 + 1.2) * 0.15;
        
        if (Math.random() < dt * 6) {
          const cp = tileTop(st.cat.fx, st.cat.fy);
          spawnFx(Math.random() < 0.5 ? "clash" : "dust", cp.x, cp.y + HTH);
        }
        if (Math.random() < dt * 1.5) {
          if (Math.random() < 0.5) sfx.bark(); else sfx.meow();
        }
        
        if (st.t > pi.until) {
          st.cat.from = { cx: st.cat.from.cx, cy: st.cat.from.cy };
          st.cat.fx = st.cat.from.cx; st.cat.fy = st.cat.from.cy;
          
          // Trova una cella adiacente libera per Cookie
          let dogTile = { cx: st.cat.from.cx, cy: st.cat.from.cy };
          for (const [adx, ady] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = st.cat.from.cx + adx, ny = st.cat.from.cy + ady;
            if (inGrid(nx, ny) && !blocked.has(tkey(nx, ny))) {
              dogTile = { cx: nx, cy: ny };
              break;
            }
          }
          st.dog.from = dogTile;
          st.dog.fx = dogTile.cx; st.dog.fy = dogTile.cy;
          
          st.cat.state = "sit"; st.cat.until = st.t + 4;
          st.dog.state = "sit"; st.dog.until = st.t + 4;
          showBubble("Purr... 🐾", 2.2, "cat");
          showBubble("Pant pant! 👅", 2.2, "dog");
          sfx.pant();
          st.petInteraction = null;
        }
      }
      
      if (st.cat.to) {
        st.cat.t += dt * 3.5;
        if (st.cat.t >= 1) {
          st.cat.from = st.cat.to; st.cat.to = null; st.cat.t = 0;
          if (st.cat.queue.length) {
            st.cat.to = st.cat.queue.shift();
            const dx = st.cat.to.cx - st.cat.from.cx, dy = st.cat.to.cy - st.cat.from.cy;
            st.cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
          }
        }
        st.cat.fx = st.cat.to ? lerp(st.cat.from.cx, st.cat.to.cx, st.cat.t) : st.cat.from.cx;
        st.cat.fy = st.cat.to ? lerp(st.cat.from.cy, st.cat.to.cy, st.cat.t) : st.cat.from.cy;
      }
      if (st.dog.to) {
        st.dog.t += dt * 3.5;
        if (st.dog.t >= 1) {
          st.dog.from = st.dog.to; st.dog.to = null; st.dog.t = 0;
          if (st.dog.queue.length) {
            st.dog.to = st.dog.queue.shift();
            const dx = st.dog.to.cx - st.dog.from.cx, dy = st.dog.to.cy - st.dog.from.cy;
            st.dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
          }
        }
        st.dog.fx = st.dog.to ? lerp(st.dog.from.cx, st.dog.to.cx, st.dog.t) : st.dog.from.cx;
        st.dog.fy = st.dog.to ? lerp(st.dog.from.cy, st.dog.to.cy, st.dog.t) : st.dog.from.cy;
      }
    } else if (isTour) {
      /* — gatto: stati e movimento normali — */
      const cat = st.cat;
      if (cat.pendingChairAt && st.t > cat.pendingChairAt) {
        cat.pendingChairAt = null;
        if (!cat.perch && !cat.to) {
          cat.until = 0;
          cat.forceChair = true;
        }
      }
      if (cat.perch) {
        const pc = cat.perch;
        if (pc.key === "table" && !pc.scattered && st.t - pc.t0 > 0.6) {
          pc.scattered = true;
          sfx.shuffle();
          const o = tablePt(7.18, 3.46);
          for (let i = 0; i < 8; i++) {
            const a = -0.45 + Math.random() * 3.7;
            const speed = 34 + Math.random() * 82;
            st.scatter.push({
              x: o.x + (Math.random() - 0.5) * 16,
              y: o.y + (Math.random() - 0.5) * 7,
              vx: Math.cos(a) * speed,
              vy: Math.sin(a) * speed * 0.42 - 10,
              rot: Math.random() * 6.28,
              vr: (Math.random() - 0.5) * 10,
              col: [P.red, "#4a7fd6", "#9a6ad6", P.gold][i % 4], t0: st.t, snapped: false,
            });
          }
          showBubble("Missy! Le mie carte! 🙀", 2.6);
        }
        if (pc.key === "desk" && cat.state === "sleep" && st.t > cat.nextZ && fx.petParticles) {
          cat.nextZ = st.t + 1.8;
          const cp2 = petFootPoint(cat);
          spawnFx("zzz", cp2.x + 6, cp2.y - 6);
        }
        if (st.t > pc.until) {
          const spot = CAT_PERCH_SPOTS[pc.key] || CAT_PERCH_SPOTS.chair;
          const land = spot.land;
          cat.perch = null;
          cat.from = land; cat.to = null; cat.t = 0; cat.queue = [];
          cat.state = "sit"; cat.until = st.t + 2 + Math.random() * 3;
          sfx.step(1);
        }
      } else if (cat.to) {
        cat.t += dt * 2.4;
        if (cat.t >= 1) {
          cat.from = cat.to; cat.to = null; cat.t = 0;
          if (onRug(cat.from.cx, cat.from.cy) && fx.prints) {
            const fp = tileTop(cat.from.cx, cat.from.cy);
            st.prints.push({ x: fp.x + (Math.random() < 0.5 ? 3 : -3), y: fp.y + HTH, t0: st.t, s: 0.55 });
            if (st.prints.length > 40) st.prints.shift();
          }
          if (cat.queue.length) {
            cat.to = cat.queue.shift();
            const dx = cat.to.cx - cat.from.cx, dy = cat.to.cy - cat.from.cy;
            cat.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
          } else {
            if (cat.goal && cat.goal.startsWith("perch_")) {
              const key = cat.goal.split("_")[1];
              const spot = CAT_PERCH_SPOTS[key] || CAT_PERCH_SPOTS.table;
              cat.perch = { key, tx: spot.tx, ty: spot.ty, lift: spot.lift, t0: st.t, until: st.t + 15 + Math.random() * 20, scattered: false };
              cat.from = { cx: spot.tx, cy: spot.ty };
              cat.fx = spot.tx; cat.fy = spot.ty;
              cat.dir = spot.dir;
              cat.state = spot.state;
              cat.goal = null;
              if (key === "chair") {
                st.chairSpin = st.t;
                sfx.click();
                const card = MTG_CARDS[Math.floor(Math.random() * MTG_CARDS.length)];
                const template = MTG_TEMPLATES[Math.floor(Math.random() * MTG_TEMPLATES.length)];
                showBubble(template(card), 3.5, "cat");
              }
            } else {
              cat.state = cat.goal || "sit";
              cat.goal = null;
              cat.until = st.t + (cat.state === "sleep" ? 18 + Math.random() * 22 : 3 + Math.random() * 5);
            }
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
          const force = cat.forceChair;
          cat.forceChair = false;
          
          if (force && !st.av.seated && !st.sitTarget) {
            catGo("perch_chair", CAT_PERCH_SPOTS.chair.approach);
          }
          else if (r < 0.25) {
            const perches = ["chair", "table", "desk"];
            const choice = perches[Math.floor(Math.random() * perches.length)];
            
            if (choice === "chair" && !st.av.seated && !st.sitTarget) {
              catGo("perch_chair", CAT_PERCH_SPOTS.chair.approach);
            } else if (choice === "table") {
              catGo("perch_table", CAT_PERCH_SPOTS.table.approach);
            } else if (choice === "desk") {
              catGo("perch_desk", CAT_PERCH_SPOTS.desk.approach);
            } else {
              cat.state = "sit"; cat.until = st.t + 3;
            }
          }
          else if (r < 0.55) {
            if (atHome) { cat.state = "sleep"; cat.until = st.t + 18 + Math.random() * 22; }
            else catGo("sleep", { cx: 4, cy: 6 });
          } else if (r < 0.85) {
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
      if (cat.state === "sleep" && !cat.to && st.t > cat.nextZ && fx.petParticles) {
        cat.nextZ = st.t + 1.8;
        const cp = petFootPoint(cat);
        spawnFx("zzz", cp.x + 6, cp.y - 6);
      }

      /* — cane (Cookie): stati e movimento normali — */
      const dog = st.dog;
      if (dog.to) {
        dog.t += dt * 2.2;
        if (dog.t >= 1) {
          dog.from = dog.to; dog.to = null; dog.t = 0;
          if (onRug(dog.from.cx, dog.from.cy) && fx.prints) {
            const fp = tileTop(dog.from.cx, dog.from.cy);
            st.prints.push({ x: fp.x + (Math.random() < 0.5 ? 2 : -2), y: fp.y + HTH, t0: st.t, s: 0.6 });
            if (st.prints.length > 40) st.prints.shift();
          }
          if (dog.queue.length) {
            dog.to = dog.queue.shift();
            const dx = dog.to.cx - dog.from.cx, dy = dog.to.cy - dog.from.cy;
            dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
          } else {
            dog.state = dog.goal || "sit";
            dog.goal = null;
            dog.until = st.t + (dog.state === "sleep" ? 15 + Math.random() * 20 : 4 + Math.random() * 6);
            if (dog.state === "sit" && Math.random() < 0.3) {
              sfx.pant();
            }
          }
        }
      } else if (st.t > dog.until) {
        const dogGo = (goal, target) => {
          const path = findPath(dog.from, target, blocked);
          if (path && path.length) {
            dog.queue = path;
            dog.to = dog.queue.shift();
            const dx = dog.to.cx - dog.from.cx, dy = dog.to.cy - dog.from.cy;
            dog.dir = dx === 1 ? "se" : dx === -1 ? "nw" : dy === 1 ? "sw" : "ne";
            dog.goal = goal;
          } else { dog.state = "sit"; dog.until = st.t + 3; }
        };
        const avT = st.av.to || st.av.from;
        const dDog = Math.abs(avT.cx - dog.from.cx) + Math.abs(avT.cy - dog.from.cy);
        if ((dog.follow > 0 || st.afk) && dDog > 1) {
          let best = null;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = avT.cx + dx, ny = avT.cy + dy;
            if (inGrid(nx, ny) && !blocked.has(tkey(nx, ny))) { best = { cx: nx, cy: ny }; break; }
          }
          if (best) { dogGo("sit", best); dog.follow = Math.max(0, dog.follow - 1); }
          else dog.until = st.t + 3;
        } else {
          const r = Math.random();
          const atHome = dog.from.cx === 5 && dog.from.cy === 7;
          
          if (r < 0.45) {
            if (atHome) { dog.state = "sleep"; dog.until = st.t + 15 + Math.random() * 20; }
            else dogGo("sleep", { cx: 5, cy: 7 });
          } else if (r < 0.8) {
            let tgt = null;
            for (let tries = 0; tries < 8 && !tgt; tries++) {
              const nx = Math.floor(Math.random() * COLS), ny = Math.floor(Math.random() * ROWS);
              if (!blocked.has(tkey(nx, ny))) tgt = { cx: nx, cy: ny };
            }
            if (tgt) dogGo("sit", tgt); else dog.until = st.t + 4;
          } else { dog.state = "sit"; dog.until = st.t + 3 + Math.random() * 5; }
        }
      }
      dog.fx = dog.to ? lerp(dog.from.cx, dog.to.cx, dog.t) : dog.from.cx;
      dog.fy = dog.to ? lerp(dog.from.cy, dog.to.cy, dog.t) : dog.from.cy;
      if (dog.state === "sleep" && !dog.to && st.t > dog.nextZ && fx.petParticles) {
        dog.nextZ = st.t + 2.0;
        const cp = tileTop(dog.fx, dog.fy);
        spawnFx("zzz", cp.x + 6, cp.y - 6);
      }
    }

    /* — update carte sparpagliate — */
    for (const card of st.scatter) {
      if (Math.abs(card.vx) > 0.1 || Math.abs(card.vy) > 0.1) {
        card.x += card.vx * dt;
        card.y += card.vy * dt;
        card.vx *= 0.90;
        card.vy *= 0.90;
        card.rot += card.vr * dt;
        card.vr *= 0.90;
      } else if (!card.snapped) {
        card.snapped = true;
        sfx.snap();
      }
    }
    st.scatter = st.scatter.filter((card) => st.t - card.t0 < 12);

    /* — note musicali dal giradischi — */
    if (sfx.musicOn() && st.t > st.nextNote && fx.particles) {
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

    /* — gestione Shadow Realm — */
    if (st.shadow) {
      if (st.t > st.shadow.until) {
        exitShadow();
      } else {
        for (const col of st.matrix) {
          col.y += dt * col.sp * 0.8;
          if (col.y > 1.2) {
            col.y = -0.2;
            col.u = Math.random();
            col.sp = 0.25 + Math.random() * 0.5;
          }
        }
        if (st.shadowCards) {
          const w = st.view ? st.view.w : WW;
          const h = st.view ? st.view.h : WH;
          for (const card of st.shadowCards) {
            card.x += card.vx * dt;
            card.y += card.vy * dt;
            card.rot += card.vr * dt;
            if (card.x < -60) card.x = w + 60;
            else if (card.x > w + 60) card.x = -60;
            if (card.y < -85) card.y = h + 85;
            else if (card.y > h + 85) card.y = -85;
          }
        }
      }
    }

    /* — busta lettere: spawn ogni 40-50s (solo Sala Tornei) — */
    if (isTour && !st.letter && st.t > st.letterNextAt && st.introDone && !st.modal && !st.lock && !st.cinematic && !st.hype) {
      spawnLetter();
    }

    /* — gestione sequenza busta lettere — */
    if (st.letter) {
      const lt = st.letter;
      if (lt.phase === "slide") {
        const elapsed = st.t - lt.t0;
        const k = easeOutBack(clamp(elapsed / 1.2, 0, 1));
        lt.x = lerp(LETTER_START.x, LETTER_REST.x, k);
        lt.y = lerp(LETTER_START.y, LETTER_REST.y, k);
        lt.rot = lerp(-0.14, 0, k);
        if (elapsed >= 1.2) {
          lt.phase = "idle";
          lt.x = LETTER_REST.x;
          lt.y = LETTER_REST.y;
          lt.rot = 0;
          lt.t0 = st.t;
        }
      } else if (lt.phase === "lift") {
        if (st.t - lt.t0 > 1.05) {
          lt.phase = "open";
          lt.t0 = st.t;
          sfx.open();
        }
      } else if (lt.phase === "open") {
        const openElapsed = st.t - lt.t0;
        if (openElapsed > 0.22 && !lt.sealSfx) {
          lt.sealSfx = true;
          st.shake = 8;
        }
        if (openElapsed > 1.35 && !lt.flapBurst) advanceLetterToReveal();
      } else if (lt.phase === "reveal") {
        const elapsed = st.t - lt.t0;
        const revealK = clamp(elapsed / 1.35, 0, 1);
        const shown = slotCreditValue(lt.creditsBefore, lt.creditsAfter, revealK);
        if (shown !== lt.lastCreditTick && revealK > 0.12 && revealK < 0.93) {
          lt.lastCreditTick = shown;
          if (Math.random() < 0.35) sfx.click();
        }
        if (elapsed > 1.35) {
          lt.phase = "done";
          lt.t0 = st.t;
          lt.lastCreditTick = lt.creditsAfter;
          sfx.ding();
          sfx.success();
        }
      }
    }

    /* — gestione sequenza Hype (solo Sala Tornei) — */
    if (isTour && st.hype) {
      const hp = st.hype;
      if (hp.phase === "alarm") {
        if (st.t > hp.nextBeep) {
          hp.nextBeep = st.t + 0.8;
          sfx.alarm();
        }
        if (!hp.walking) {
          hp.walking = true;
          const t00 = av.to || av.from;
          let best = null;
          for (const [x, y] of inter.decks.approach) {
            const p = findPath(t00, { cx: x, cy: y }, blocked);
            if (p && (!best || p.length < best.length)) best = p;
          }
          if (best && best.length) {
            av.queue = best;
            shiftStep();
          }
        }
        if (hp.walking && !av.to && !av.queue.length) {
          const elapsed = st.t - hp.t0;
          if (elapsed > 2.0) {
            av.dir = "ne";
            hp.phase = "nod";
            hp.t0 = st.t;
          }
        }
      }
      else if (hp.phase === "nod") {
        av.dir = "sw";
        const elapsed = st.t - hp.t0;
        if (elapsed > 0.4 && !hp.sparked) {
          hp.sparked = true;
          const ap = tileTop(av.fx, av.fy);
          spawnFx("spark", ap.x - 4, ap.y - 32, 3);
          sfx.success();
          showBubble("👍 Fatti sotto! Pronto al match!", 2.5);
        }
        if (elapsed > 1.8) {
          hp.phase = "split";
          hp.t0 = st.t;
          sfx.shuffle();
        }
      }
      else if (hp.phase === "split") {
        const elapsed = st.t - hp.t0;
        if (elapsed > 1.0) {
          hp.phase = "deal";
          hp.t0 = st.t;
          hp.deals = [];
          hp.nextDeal = 0;
        }
      }
      else if (hp.phase === "deal" && hp.deals) {
        const elapsed = st.t - hp.t0;
        if (hp.deals.length < 4 && st.t > hp.nextDeal) {
          hp.nextDeal = st.t + 0.22;
          const angle = Math.random() * Math.PI * 2;
          const speed = 70 + Math.random() * 50;
          const tCenter = tablePt(7.0, 3.0);
          hp.deals.push({
            x: tCenter.x, y: tCenter.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 0.6,
            rot: 0, vr: (Math.random() - 0.5) * 12,
            color: ["#d94f46", "#4a7fd6", "#9a6ad6", P.gold][hp.deals.length]
          });
          sfx.snap();
        }
        for (const card of hp.deals) {
          card.x += card.vx * dt;
          card.y += card.vy * dt;
          card.vx *= 0.90;
          card.vy *= 0.90;
          card.rot += card.vr * dt;
          card.vr *= 0.90;
        }
        if (elapsed > 1.8) {
          hp.phase = "zoom";
          hp.t0 = st.t;
          sfx.whoosh();
        }
      }
      else if (hp.phase === "zoom") {
        const elapsed = st.t - hp.t0;
        const k = clamp(elapsed / 1.0, 0, 1);
        st.cam.x = lerp(DEFAULT_CAM.x, scrCenter.x, k);
        st.cam.y = lerp(DEFAULT_CAM.y, scrCenter.y, k);
        st.cam.z = lerp(1, 14, k * k);
        if (elapsed > 1.0) {
          st.hype = null;
          st.cinematic = false;
          st.cam.x = DEFAULT_CAM.x;
          st.cam.y = DEFAULT_CAM.y;
          st.cam.z = 1;
          if (apiRef.current.openModal) apiRef.current.openModal("pc");
        }
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
    if (!sil || !fx.glows) return;
    wctx.save();
    wctx.globalAlpha = Math.min(0.85, (0.26 + 0.16 * Math.sin(st.t * 4.2)) * k);
    wctx.globalCompositeOperation = "lighter";
    for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) wctx.drawImage(sil, x + ox, y + oy);
    wctx.restore();
  }

  function drawCatSprite() {
    const cat = st.cat;
    const pt = petFootPoint(cat);
    const cxp = pt.x, cyp = pt.y;
    const moving = !!cat.to;
    const perched = !!cat.perch;
    
    // ombra a terra
    const shadowAlpha = perched ? 0.16 : 0.22;
    wctx.fillStyle = "rgba(25,22,40," + shadowAlpha + ")";
    wctx.beginPath();
    wctx.ellipse(cxp, cyp + 4, perched ? 7.5 : 9, perched ? 2.6 : 3.5, 0, 0, Math.PI * 2);
    wctx.fill();
    
    const flip = cat.dir === "nw" || cat.dir === "sw" ? 2 : 0;
    let fr;
    if (moving) fr = catSp.walk[flip + (Math.floor(st.t * 7) % 2)];
    else if (cat.state === "sleep") fr = catSp.sleep[flip + (Math.floor(st.t * 0.9) % 2)];
    else fr = catSp.sit[flip + (Math.floor(st.t * 1.4) % 2)];
    const bob = moving ? -Math.abs(Math.sin(cat.t * Math.PI * 2)) * 1 : 0;
    const perchBob = perched ? Math.sin((st.t - cat.perch.t0) * 8) * Math.max(0, 1 - (st.t - cat.perch.t0) * 2) : 0;
    wctx.drawImage(fr.cv, Math.round(cxp - fr.feet.x), Math.round(cyp + 4 - fr.feet.y + bob + perchBob));
  }

  function drawDogSprite() {
    const dog = st.dog;
    const pt = petFootPoint(dog);
    const cxp = pt.x, cyp = pt.y;
    const moving = !!dog.to;
    const lift = dog.perch ? dog.perch.lift : 0;
    
    // ombra a terra
    const shadowAlpha = lift > 0 ? 0.12 : 0.22;
    wctx.fillStyle = "rgba(25,22,40," + shadowAlpha + ")";
    wctx.beginPath();
    wctx.ellipse(cxp, cyp + 4, lift > 0 ? 6.5 : 9, lift > 0 ? 2.5 : 3.5, 0, 0, Math.PI * 2);
    wctx.fill();
    
    const flip = dog.dir === "nw" || dog.dir === "sw" ? 2 : 0;
    let fr;
    if (moving) fr = dogSp.walk[flip + (Math.floor(st.t * 7) % 2)];
    else if (dog.state === "sleep") fr = dogSp.sleep[flip + (Math.floor(st.t * 0.9) % 2)];
    else fr = dogSp.sit[flip + (Math.floor(st.t * 1.4) % 2)];
    const bob = moving ? -Math.abs(Math.sin(dog.t * Math.PI * 2)) * 1 : 0;
    wctx.drawImage(fr.cv, Math.round(cxp - fr.feet.x), Math.round(cyp + 4 - fr.feet.y + bob - lift));
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
    const c = tileTop(8.4, 3.6);
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
    if (st.shadow && (!seated || st.afk)) {
      // aura scura/viola pulsante
      const pulse = 1 + 0.15 * Math.sin(st.t * 3);
      const auraG = wctx.createRadialGradient(cxp, cyp + 5, 2, cxp, cyp + 5, 16 * pulse);
      auraG.addColorStop(0, "rgba(128, 0, 255, 0.45)");
      auraG.addColorStop(1, "rgba(0, 0, 0, 0)");
      wctx.fillStyle = auraG;
      wctx.beginPath(); wctx.ellipse(cxp, cyp + 5, 16 * pulse, 6.5 * pulse, 0, 0, Math.PI * 2); wctx.fill();
    } else if (!seated || st.afk) {
      wctx.fillStyle = "rgba(25,22,40,0.28)";
      wctx.beginPath(); wctx.ellipse(cxp, cyp + 5, 12.5, 5, 0, 0, Math.PI * 2); wctx.fill();
    }
    let sp;
    if (seated) sp = avatar.sit[Math.floor(st.t * 1.2) % 2];
    else {
      const D = avatar[av.dir];
      if (moving && !st.shadow) sp = D.walk[Math.floor(av.wt) % 4];
      else if (st.t < av.blinkUntil && (av.dir === "se" || av.dir === "sw")) sp = D.blink;
      else sp = D.idle[Math.floor(st.t * 1.3) % 2];
    }
    const bob = (moving && !st.shadow) ? -Math.abs(Math.sin(av.t * Math.PI)) * 1.6
      : st.afk ? Math.sin(st.t * 1.6) * 1.2 : 0; // respiro lento in meditazione
    const shadowLift = st.shadow && !seated ? Math.sin(st.t * 3.5) * 4 - 5 : 0; // fluttua nello Shadow Realm
    const lift = seated ? (st.afk ? 5 : 21) : 0; // sedia vs tappeto
    wctx.drawImage(sp.cv, Math.round(cxp - sp.feet.x), Math.round(cyp + 6 - sp.feet.y + bob - lift + shadowLift));
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

  /* — Asso: la mascotte-guida (in pixel-art) che fluttua accanto al personaggio
     durante il tutorial (coordinata con il narratore in alto). — */
  // posizione "guida": insegue un punto davanti all'avatar verso la meta
  function updateSpettro() {
    const av = st.av;
    if (!st.spet) st.spet = { fx: av.fx, fy: av.fy };
    const DIRV = { se: { x: 1, y: 0 }, nw: { x: -1, y: 0 }, sw: { x: 0, y: 1 }, ne: { x: 0, y: -1 } };
    const dest = av.to || (av.queue && av.queue.length ? av.queue[av.queue.length - 1] : null);
    let lx, ly, lead;
    if (dest && (Math.abs(dest.cx - av.fx) > 0.05 || Math.abs(dest.cy - av.fy) > 0.05)) {
      const dx = dest.cx - av.fx, dy = dest.cy - av.fy, len = Math.hypot(dx, dy) || 1;
      lx = av.fx + (dx / len) * 1.6;   // ~1,6 caselle davanti, verso la meta
      ly = av.fy + (dy / len) * 1.6;
      lead = 0.11;                     // insegue spedito per restare davanti
    } else {
      const d = DIRV[av.dir] || { x: 0, y: -1 };
      lx = av.fx + d.x * 1.05;         // da fermo aleggia poco davanti (non incollato)
      ly = av.fy + d.y * 1.05;
      lead = 0.05;                     // avvicinamento morbido
    }
    const pfx = st.spet.fx, pfy = st.spet.fy;
    st.spet.fx += (lx - st.spet.fx) * lead;
    st.spet.fy += (ly - st.spet.fy) * lead;
    st.spet.vx = (st.spet.vx || 0) * 0.82 + (st.spet.fx - pfx) * 0.18;
    st.spet.vy = (st.spet.vy || 0) * 0.82 + (st.spet.fy - pfy) * 0.18;
    return st.spet;
  }
  function drawSpettroCompanion() {
    const sp = st.spet || updateSpettro();
    const c = tileTop(sp.fx, sp.fy);
    const t = st.t;
    const fl = Math.sin(t * 2.0) * 2.6 + Math.sin(t * 0.9) * 1.2;   // fluttuazione composita
    const cx = c.x;
    const cy = c.y + HTH - 36 + fl;
    const groundY = c.y + HTH + 4;

    // velocita schermo -> inclinazione + direzione dello sguardo
    const vsx = ((sp.vx || 0) - (sp.vy || 0)) * HTW;
    const vsy = ((sp.vx || 0) + (sp.vy || 0)) * HTH;
    const lean = Math.max(-0.30, Math.min(0.30, vsx * 0.10));
    const eyeDX = Math.max(-1.7, Math.min(1.7, vsx * 0.9));
    const eyeDY = Math.max(-1.2, Math.min(1.2, vsy * 0.9));

    wctx.save();

    // ombra a terra (si stringe e schiarisce quando fluttua piu in alto)
    const hgt = groundY - cy;
    const shA = Math.max(0.05, 0.2 - hgt * 0.0035);
    const shR = Math.max(5, 11 - hgt * 0.055);
    wctx.fillStyle = "rgba(30,20,10," + shA.toFixed(3) + ")";
    wctx.beginPath(); wctx.ellipse(cx, groundY, shR, shR * 0.4, 0, 0, Math.PI * 2); wctx.fill();

    // alone arancione pulsante
    const glowR = 21 + Math.sin(t * 2.4) * 3;
    const g = wctx.createRadialGradient(cx, cy, 2, cx, cy, glowR);
    g.addColorStop(0, "rgba(255,150,60," + (0.30 + 0.08 * Math.sin(t * 2.4)).toFixed(3) + ")");
    g.addColorStop(1, "rgba(255,150,60,0)");
    wctx.fillStyle = g;
    wctx.beginPath(); wctx.arc(cx, cy, glowR, 0, Math.PI * 2); wctx.fill();

    // corpo in spazio locale: inclinato + respiro squash/stretch
    wctx.translate(cx, cy);
    wctx.rotate(lean);
    const breath = Math.sin(t * 2.6);
    wctx.scale(1 + breath * 0.05, 1 - breath * 0.05);

    // — Asso in pixel-art (stessa griglia della mascotte del sito) —
    const blink = (t % 4.6) > 4.36 ? 0.14 : 1;
    const PXS = 1.55;                                   // dimensione del pixel
    const oxg = -ASSO_GW * PXS / 2;                     // angolo alto-sinistra
    const oyg = -ASSO_GH * PXS / 2 + 1;
    const cellW = PXS + 0.45;                           // micro-overlap: niente fessure
    for (let gy = 0; gy < ASSO_GH; gy++) {
      const row = ASSO_GRID[gy];
      for (let gx = 0; gx < ASSO_GW; gx++) {
        const col = ASSO_BODY_COL[row[gx]];
        if (!col) continue;                             // salta vuoti, ombra, scintille, occhi
        wctx.fillStyle = col;
        wctx.fillRect(oxg + gx * PXS, oyg + gy * PXS, cellW, cellW);
      }
    }
    // occhi: guardano nella direzione di marcia e sbattono
    const eOX = Math.max(-1.2, Math.min(1.2, eyeDX * 0.55));
    const eOY = Math.max(-1.0, Math.min(1.0, eyeDY * 0.55));
    if (blink > 0.5) {
      for (const e of ASSO_EYE_CELLS) {
        wctx.fillStyle = e.w ? "#ffffff" : "#4a5548";
        wctx.fillRect(oxg + e.x * PXS + eOX, oyg + e.y * PXS + eOY, cellW, cellW);
      }
    } else {
      wctx.fillStyle = "#4a5548";                       // occhi chiusi: due trattini
      wctx.fillRect(oxg + 6 * PXS + eOX, oyg + 8.7 * PXS, 2 * PXS, PXS * 0.8);
      wctx.fillRect(oxg + 10 * PXS + eOX, oyg + 8.7 * PXS, 2 * PXS, PXS * 0.8);
    }

    wctx.restore();

    // scintille orbitanti
    for (let i = 0; i < 3; i++) {
      const a = t * 1.1 + i * 2.094;
      const rad = 17 + 2 * Math.sin(t * 2 + i);
      const sxp = cx + Math.cos(a) * rad * 1.15;
      const syp = cy + Math.sin(a) * rad * 0.62 - 2;
      const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 2.3);
      wctx.globalAlpha = tw * 0.8;
      wctx.fillStyle = "#ffd9a0";
      const r = 1.6 + tw * 0.8;
      wctx.beginPath();
      wctx.moveTo(sxp, syp - r); wctx.lineTo(sxp + r * 0.5, syp);
      wctx.lineTo(sxp, syp + r); wctx.lineTo(sxp - r * 0.5, syp);
      wctx.closePath(); wctx.fill();
    }
    wctx.globalAlpha = 1;
  }

  const drawLetterEnvelope = (c, dx, dy, opts = {}) => {
    const flapOpen = opts.flapOpen || 0;
    const sealBreak = opts.sealBreak || 0;
    const rot = opts.rot || 0;
    const scale = opts.scale != null ? opts.scale : 1;
    const glow = opts.glow || 0;
    const bw = 50, bh = 34, hinge = -10;
    /* Palette premium Ebartex: dark + oro foil */
    const EB_DARK = "#0F172A", EB_DARK2 = "#111827", EB_GOLD = "#F3C76A", EB_GOLD_D = "#c98f2b";

    c.save();
    c.translate(dx, dy);
    c.rotate(rot);
    c.scale(scale, scale);

    if (glow > 0) {
      const pg = c.createRadialGradient(0, 0, 4, 0, 0, 52);
      pg.addColorStop(0, "rgba(243, 199, 106, " + (0.6 * glow).toFixed(3) + ")");
      pg.addColorStop(0.45, "rgba(243, 199, 106, " + (0.18 * glow).toFixed(3) + ")");
      pg.addColorStop(1, "rgba(243, 199, 106, 0)");
      c.fillStyle = pg;
      c.beginPath();
      c.arc(0, 0, 52, 0, Math.PI * 2);
      c.fill();
    }

    c.fillStyle = "rgba(0,0,0,0.32)";
    c.beginPath();
    c.ellipse(0, 19, 30, 9, 0, 0, Math.PI * 2);
    c.fill();

    /* pannello posteriore scuro (sporge 2px come lembo dietro) */
    c.fillStyle = "#080b14";
    rr(c, -bw / 2 - 2, -bh / 2 + 4, bw + 4, bh + 5, 4);
    c.fill();

    /* corpo busta: gradient dark Ebartex */
    const body = c.createLinearGradient(0, -bh / 2, 0, bh / 2 + 4);
    body.addColorStop(0, "#1a2440");
    body.addColorStop(0.55, EB_DARK);
    body.addColorStop(1, EB_DARK2);
    c.fillStyle = body;
    rr(c, -bw / 2, -bh / 2, bw, bh, 3);
    c.fill();
    /* bordo oro */
    c.strokeStyle = EB_GOLD;
    c.lineWidth = 1.4;
    c.strokeRect(-bw / 2, -bh / 2, bw, bh);

    /* banda accent gradient-card2 (oro→viola Ebartex) diagonale faint */
    c.save();
    c.beginPath();
    rr(c, -bw / 2 + 1, -bh / 2 + 1, bw - 2, bh - 2, 2.5);
    c.clip();
    const band = c.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
    band.addColorStop(0, "rgba(204, 126, 74, 0.22)");
    band.addColorStop(0.5, "rgba(41, 20, 66, 0)");
    band.addColorStop(1, "rgba(243, 199, 106, 0.14)");
    c.fillStyle = band;
    c.fillRect(-bw / 2, -bh / 2, bw, bh);
    /* wordmark EBARTEX oro sul corpo busta (visibile su sfondo dark) */
    c.fillStyle = "rgba(243, 199, 106, 0.38)";
    c.font = "800 6.5px 'Segoe UI', system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("EBARTEX", 0, 6);
    /* sottolineatura mini brand */
    c.strokeStyle = "rgba(243, 199, 106, 0.3)";
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-10, 11); c.lineTo(10, 11);
    c.stroke();
    c.textBaseline = "alphabetic";
    c.restore();

    /* lembi laterali ombreggiati (effetto piega) */
    c.fillStyle = "rgba(0,0,0,0.22)";
    c.beginPath();
    c.moveTo(-bw / 2, -bh / 2); c.lineTo(-bw / 2 + 11, 2); c.lineTo(-bw / 2, bh / 2);
    c.closePath(); c.fill();
    c.beginPath();
    c.moveTo(bw / 2, -bh / 2); c.lineTo(bw / 2 - 11, 2); c.lineTo(bw / 2, bh / 2);
    c.closePath(); c.fill();

    /* interno: camera scura + fascio di luce oro che cresce col flap */
    if (flapOpen > 0.04) {
      c.fillStyle = "#070a12";
      rr(c, -bw / 2 + 6, -bh / 2 + 5, bw - 12, bh - 10, 2);
      c.fill();
      const ig = c.createRadialGradient(0, hinge + 4, 2, 0, hinge + 4, 30);
      ig.addColorStop(0, "rgba(255, 233, 160, " + (0.85 * flapOpen).toFixed(3) + ")");
      ig.addColorStop(0.42, "rgba(243, 199, 106, " + (0.3 * flapOpen).toFixed(3) + ")");
      ig.addColorStop(1, "rgba(243, 199, 106, 0)");
      c.fillStyle = ig;
      c.fillRect(-bw / 2 + 6, -bh / 2 + 6, bw - 12, bh - 12);
      /* lettera interna che emerge col flap: carta chiara con gradient + bordo + piega + scritta */
      const lY = -7 - flapOpen * 3;
      const lA = clamp(flapOpen * 1.2, 0, 1);
      c.save();
      c.globalAlpha = lA;
      const lgrad = c.createLinearGradient(0, lY, 0, lY + 22);
      lgrad.addColorStop(0, "#fffdf4");
      lgrad.addColorStop(0.55, "#f7f1dd");
      lgrad.addColorStop(1, "#ece3c2");
      c.fillStyle = lgrad;
      rr(c, -14, lY, 28, 22, 2);
      c.fill();
      c.strokeStyle = "rgba(90, 58, 24, 0.45)";
      c.lineWidth = 0.8;
      c.stroke();
      /* piega centrale verticale faint */
      c.strokeStyle = "rgba(90, 58, 24, 0.18)";
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(0, lY + 2); c.lineTo(0, lY + 20);
      c.stroke();
      /* intestazione "EBARTEX" in dark sopra la lettera (visibile su carta chiara) */
      c.fillStyle = "#3a2a1a";
      c.font = "800 5px 'Segoe UI', system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("EBARTEX", 0, lY + 5);
      /* piccolo simbolo € sotto la scritta */
      c.fillStyle = "#c98f2b";
      c.font = "900 8px 'Segoe UI', system-ui, sans-serif";
      c.fillText("€", 0, lY + 14);
      c.textBaseline = "alphabetic";
      c.restore();
    }

    /* flap superiore: dark + bordo oro, apertura con squama Y + rotazione + luce */
    c.save();
    c.translate(0, hinge);
    c.scale(1, Math.max(0.16, 1 - flapOpen * 0.8));
    c.translate(0, -flapOpen * 7);
    c.rotate(-flapOpen * 0.28);
    c.translate(0, -hinge);
    const flap = c.createLinearGradient(0, hinge - 23, 0, hinge + 4);
    flap.addColorStop(0, "#1a2440");
    flap.addColorStop(0.6, EB_DARK);
    flap.addColorStop(1, "#080b14");
    c.fillStyle = flap;
    c.beginPath();
    c.moveTo(-bw / 2, hinge);
    c.lineTo(0, hinge - 23);
    c.lineTo(bw / 2, hinge);
    c.closePath();
    c.fill();
    c.strokeStyle = EB_GOLD;
    c.lineWidth = 1.3;
    c.stroke();
    /* sottile highlight dorato sul bordo alto del flap */
    c.strokeStyle = "rgba(255, 233, 160, 0.5)";
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-bw / 2 + 2, hinge - 1);
    c.lineTo(0, hinge - 21);
    c.lineTo(bw / 2 - 2, hinge - 1);
    c.stroke();
    c.restore();

    /* sigillo cera → foil oro Ebartex con "E" embossed */
    if (sealBreak < 0.92) {
      const sealA = 1 - sealBreak;
      const sealS = 1 - sealBreak * 0.75;
      const sy = hinge + 3;
      c.save();
      c.translate(0, sy);
      c.scale(sealS, sealS);
      /* disco oro foil con anello interno */
      const sg = c.createRadialGradient(-2, -2, 1, 0, 0, 9);
      sg.addColorStop(0, "#ffe6a8");
      sg.addColorStop(0.5, EB_GOLD);
      sg.addColorStop(1, EB_GOLD_D);
      c.fillStyle = sg;
      c.beginPath();
      c.arc(0, 0, 8, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(120, 80, 20, " + sealA + ")";
      c.lineWidth = 1;
      c.stroke();
      c.strokeStyle = "rgba(255, 245, 200, " + (0.7 * sealA) + ")";
      c.lineWidth = 0.6;
      c.beginPath();
      c.arc(0, 0, 5.5, 0, Math.PI * 2);
      c.stroke();
      /* "E" embossed scuro + highlight */
      c.fillStyle = "rgba(40, 24, 8, " + sealA + ")";
      c.font = "900 9px 'Segoe UI', system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("E", 0, 0.5);
      c.fillStyle = "rgba(255, 245, 200, " + (0.35 * sealA) + ")";
      c.fillText("E", -0.4, 0.1);
      c.textBaseline = "alphabetic";
      c.restore();
      /* schegge di rottura oro (12 vs 7) */
      if (sealBreak > 0.35) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + sealBreak * 2;
          const dist = sealBreak * (11 + i * 1.1);
          c.fillStyle = "rgba(243, 199, 106, " + (sealA * 0.85) + ")";
          c.fillRect(Math.cos(a) * dist - 1.3, sy + Math.sin(a) * dist - 1.3, 2.6, 2.6);
        }
      }
    }

    c.restore();
  };

  const drawCreditsReward = (c, dx, dy, tournamentName, creditsBefore, creditsAfter, progress, uiScale = 1, animT = 0, showActions = false, opts = {}) => {
    const k = clamp(progress, 0, 1);
    const pop = 0.88 + 0.12 * easeOutBack(k);
    const s = uiScale * pop;
    const shown = slotCreditValue(creditsBefore, creditsAfter, k);
    const counting = k > 0.1 && k < 0.94;
    const delta = creditsAfter - creditsBefore;
    const deltaK = clamp((k - 0.46) / 0.32, 0, 1);

    c.save();
    c.translate(dx, dy);
    c.scale(s, s);

    const { w: tw, h: th, btnW, btnH, btnCy } = CREDITS_REWARD_CARD;
    const top = -th / 2;
    const EB_GOLD = "#F3C76A";

    /* ombra card */
    c.fillStyle = "rgba(0,0,0,0.38)";
    rr(c, -tw / 2 + 8, top + 10, tw - 16, th, 18);
    c.fill();

    /* corpo card: gradient dark Ebartex */
    const tg = c.createLinearGradient(0, top, 0, top + th);
    tg.addColorStop(0, "#1a2440");
    tg.addColorStop(0.5, "#0F172A");
    tg.addColorStop(1, "#090b12");
    c.fillStyle = tg;
    rr(c, -tw / 2, top, tw, th, 16);
    c.fill();

    /* bordo oro + interno */
    c.strokeStyle = EB_GOLD;
    c.lineWidth = 2;
    c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.14)";
    c.lineWidth = 1;
    rr(c, -tw / 2 + 8, top + 8, tw - 16, th - 16, 12);
    c.stroke();

    c.textAlign = "center";
    c.textBaseline = "middle";

    /* — brand EBARTEX + divisore oro — */
    c.fillStyle = EB_GOLD;
    c.font = "800 10px 'Segoe UI', system-ui, sans-serif";
    c.fillText("EBARTEX", 0, top + 18);
    c.strokeStyle = "rgba(243, 199, 106, 0.45)";
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-44, top + 26); c.lineTo(44, top + 26);
    c.stroke();

    /* — titolo — */
    c.fillStyle = "rgba(255,245,216,0.96)";
    c.font = "900 18px 'Segoe UI', system-ui, sans-serif";
    c.fillText("Payout torneo", 0, top + 48);

    /* — nome torneo — */
    c.font = "700 14px 'Segoe UI', system-ui, sans-serif";
    c.fillStyle = "#ffb347";
    const name = tournamentName.length > 26 ? tournamentName.slice(0, 24) + "..." : tournamentName;
    c.fillText(name + "!", 0, top + 72);

    /* — label crediti — */
    c.fillStyle = "rgba(255,255,255,0.55)";
    c.font = "700 10px 'Segoe UI', system-ui, sans-serif";
    c.fillText("I tuoi crediti", 0, top + 98);

    /* — counter slot (effetto rotella con decelerazione + motion blur + gloss) — */
    const counterCy = top + 132;
    const kSpin = clamp((k - 0.1) / 0.84, 0, 1);     // 0→1 durante il counting
    const spinPos = 6 * easeOutCubic(kSpin);          // posizione cumulativa (decelera)
    const phaseFade = 1 - easeInCubic(clamp((kSpin - 0.85) / 0.15, 0, 1)); // sfuma offset→0 in coda
    const fast = counting && kSpin < 0.7;             // fase veloce → abilita motion blur
    const glowA = counting ? 0.3 + 0.16 * Math.sin(animT * 16) : 0.24;
    /* flash dorato al fermarsi (k in [0.94, 1.0]) */
    const stopFlash = k > 0.94 ? (1 - clamp((k - 0.94) / 0.06, 0, 1)) * 0.55 : 0;

    const cg = c.createRadialGradient(0, counterCy, 10, 0, counterCy, 86);
    cg.addColorStop(0, "rgba(243, 199, 106, " + (glowA + stopFlash).toFixed(3) + ")");
    cg.addColorStop(0.55, "rgba(204, 126, 74, 0.12)");
    cg.addColorStop(1, "rgba(243, 199, 106, 0)");
    c.fillStyle = cg;
    c.beginPath();
    c.ellipse(0, counterCy, 106, 42, 0, 0, Math.PI * 2);
    c.fill();

    const slotW = 214, slotH = 52;
    c.fillStyle = "#05070d";
    rr(c, -slotW / 2, counterCy - slotH / 2, slotW, slotH, 10);
    c.fill();
    const slotG = c.createLinearGradient(0, counterCy - slotH / 2, 0, counterCy + slotH / 2);
    slotG.addColorStop(0, "rgba(255,255,255,0.12)");
    slotG.addColorStop(0.45, "rgba(255,255,255,0.02)");
    slotG.addColorStop(0.52, "rgba(0,0,0,0.35)");
    slotG.addColorStop(1, "rgba(243, 199, 106, 0.08)");
    c.fillStyle = slotG;
    rr(c, -slotW / 2 + 3, counterCy - slotH / 2 + 3, slotW - 6, slotH - 6, 8);
    c.fill();
    c.strokeStyle = "rgba(243, 199, 106, " + (0.6 + stopFlash * 0.4).toFixed(3) + ")";
    c.lineWidth = 1.4 + stopFlash * 1.2;
    c.stroke();
    /* gloss highlight: riflesso bianco in alto del box slot */
    const gloss = c.createLinearGradient(0, counterCy - slotH / 2, 0, counterCy - slotH / 2 + 14);
    gloss.addColorStop(0, "rgba(255,255,255,0.18)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = gloss;
    rr(c, -slotW / 2 + 4, counterCy - slotH / 2 + 4, slotW - 8, 14, 6);
    c.fill();

    c.save();
    c.beginPath();
    rr(c, -slotW / 2 + 7, counterCy - slotH / 2 + 7, slotW - 14, slotH - 14, 6);
    c.clip();
    const value = formatCredits(shown);
    const chars = value.split("");
    const totalW = chars.reduce((sum, ch) => sum + (ch === "." ? 9 : 25), 0) + (chars.length - 1) * 3;
    let x = -totalW / 2;
    c.font = "900 28px 'Segoe UI', system-ui, sans-serif";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const cw = ch === "." ? 9 : 25;
      if (ch === ".") {
        c.fillStyle = "rgba(255,235,178,0.75)";
        c.fillText(".", x + cw / 2, counterCy + 9);
      } else {
        const bx = x + cw / 2;
        /* box digit singolo con bordino */
        c.fillStyle = "rgba(255,255,255,0.06)";
        rr(c, x, counterCy - 18, cw, 36, 5);
        c.fill();
        c.strokeStyle = "rgba(243, 199, 106, 0.18)";
        c.lineWidth = 0.8;
        c.stroke();
        /* spin: posizione cumulativa che decelera + offset che sfuma a 0 in coda */
        const spin = counting ? (spinPos + i * 0.31 * phaseFade) % 1 : 0;
        const off = easeOutCubic(spin) * 36;
        const digitCol = counting ? "#fff8df" : "#ffd978";
        c.shadowColor = "rgba(243, 199, 106, 0.9)";
        c.shadowBlur = counting ? 8 : 5;
        /* motion blur: 2 ghost quando gira veloce */
        if (fast) {
          c.globalAlpha = 0.22;
          c.fillStyle = digitCol;
          c.fillText(ch, bx, counterCy + 9 - off + 16);
          c.fillText(ch, bx, counterCy + 9 - off - 16);
          c.globalAlpha = 1;
        }
        c.fillStyle = digitCol;
        c.fillText(ch, bx, counterCy + 9 - off);
        if (counting) c.fillText(String((Number(ch) + 1) % 10), bx, counterCy + 45 - off);
        c.shadowBlur = 0;
      }
      x += cw + 3;
    }
    c.restore();

    /* — badge +X crediti (verde) — */
    if (deltaK > 0) {
      const dPop = easeOutBack(deltaK);
      c.save();
      c.translate(0, top + 182);
      c.scale(dPop, dPop);
      c.fillStyle = "rgba(78, 222, 142, 0.16)";
      rr(c, -88, -17, 176, 34, 14);
      c.fill();
      c.strokeStyle = "rgba(110,231,168,0.55)";
      c.lineWidth = 1;
      c.stroke();
      c.fillStyle = "#6ee7a8";
      c.font = "900 16px 'Segoe UI', system-ui, sans-serif";
      c.fillText("+" + formatCredits(delta) + " crediti", 0, 0);
      c.restore();
    }

    /* — scintille orbitanti durante il count — */
    if (counting) {
      for (let i = 0; i < 10; i++) {
        const a = animT * 2.8 + i * 0.72;
        const rad = 86 + 12 * Math.sin(animT * 3 + i);
        const px = Math.cos(a) * rad;
        const py = counterCy + Math.sin(a) * rad * 0.34;
        c.globalAlpha = 0.35 + 0.35 * Math.sin(animT * 5 + i);
        c.fillStyle = i % 2 ? "#F3C76A" : "#ff8a2a";
        c.beginPath();
        c.arc(px, py, 2.2 + (i % 3) * 0.6, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    }

    /* — footer info + bottone (solo a sequenza conclusa) — */
    if (showActions) {
      c.fillStyle = "rgba(255,255,255,0.42)";
      c.font = "500 11px 'Segoe UI', system-ui, sans-serif";
      c.fillText("Saldo aggiornato: " + formatCredits(creditsAfter), 0, top + 210);

      /* riga link: "Credito pronto sul portale Ebartex." con "Ebartex" arancione cliccabile */
      const footY = top + 230;
      const footFont = "600 11px 'Segoe UI', system-ui, sans-serif";
      c.font = footFont;
      const prefix = "Credito pronto sul portale ";
      const linkText = "Ebartex";
      const suffix = ".";
      const wPrefix = c.measureText(prefix).width;
      const wLink = c.measureText(linkText).width;
      const wSuffix = c.measureText(suffix).width;
      const wTotal = wPrefix + wLink + wSuffix;
      const startX = -wTotal / 2;
      const prevAlign = c.textAlign;
      c.textAlign = "left";
      /* prefisso bianco */
      c.fillStyle = "rgba(255,255,255,0.78)";
      c.fillText(prefix, startX, footY);
      /* link "Ebartex" arancione + sottolineatura (più forte se hover) */
      const linkX = startX + wPrefix;
      c.fillStyle = EB_LINK_ORANGE;
      c.fillText(linkText, linkX, footY);
      c.strokeStyle = EB_LINK_ORANGE;
      c.lineWidth = opts.ebartexHover ? 1.4 : 0.9;
      c.globalAlpha = opts.ebartexHover ? 1 : 0.7;
      c.beginPath();
      c.moveTo(linkX, footY + 3);
      c.lineTo(linkX + wLink, footY + 3);
      c.stroke();
      c.globalAlpha = 1;
      /* suffix */
      c.fillStyle = "rgba(255,255,255,0.78)";
      c.fillText(suffix, linkX + wLink, footY);
      c.textAlign = prevAlign;

      const btnTop = btnCy - btnH / 2;
      const bg = c.createLinearGradient(0, btnTop, 0, btnTop + btnH);
      bg.addColorStop(0, "#ff7a32");
      bg.addColorStop(1, "#c83935");
      c.fillStyle = bg;
      rr(c, -btnW / 2, btnTop, btnW, btnH, 10);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.72)";
      c.lineWidth = 1.2;
      c.stroke();
      c.fillStyle = "#ffffff";
      c.font = "900 13px 'Segoe UI', system-ui, sans-serif";
      c.fillText("CHIUDI", 0, btnCy);
    }

    c.textAlign = "left";
    c.textBaseline = "alphabetic";
    c.restore();
  };

  const drawShadowCard = (c, card) => {
    c.save();
    c.translate(card.x, card.y);
    c.rotate(card.rot);
    c.scale(card.scale, card.scale);
    
    // Ombra/glow soffusa viola dietro la carta
    const cardGlow = c.createRadialGradient(0, 0, 2, 0, 0, 16);
    cardGlow.addColorStop(0, "rgba(128, 0, 255, 0.35)");
    cardGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    c.fillStyle = cardGlow;
    c.beginPath();
    c.arc(0, 0, 16, 0, Math.PI * 2);
    c.fill();

    // Corpo carta
    c.fillStyle = "#120a1c"; // sfondo scuro esoterico
    rr(c, -11, -17, 22, 34, 3);
    c.fill();
    
    // Bordo colorato
    c.strokeStyle = card.col;
    c.lineWidth = 1;
    rr(c, -10, -16, 20, 32, 2.5);
    c.stroke();
    
    // Logo "E" o "BRX"
    c.fillStyle = card.col;
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (card.type === "ebartex") {
      c.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
      c.fillText("E", 0, -1);
    } else {
      c.font = "bold 6px 'Press Start 2P', monospace";
      c.fillText("BRX", 0, 0);
    }
    
    // Piccoli dettagli decorativi retro carta
    c.fillStyle = "rgba(255, 255, 255, 0.12)";
    c.fillRect(-7, -13, 14, 1);
    c.fillRect(-7, 12, 14, 1);
    
    c.restore();
  };

  function render() {
    const { w, h, dpr, scale } = st.view;
    const isTour = st.room === "tournament";
    /* — mondo — */
    wctx.clearRect(0, 0, WW, WH);
    wctx.drawImage(bg, 0, 0);

    /* — Shadow Realm: finestra dinamica + poster glifi — */
    if (isTour && st.shadow && fx.shadowEffects) {
      wctx.save();
      wctx.beginPath();
      const g0 = wallL(5.82, 86), g1 = wallL(7.58, 86), g2 = wallL(7.58, 34), g3 = wallL(5.82, 34);
      wctx.moveTo(g0.x, g0.y); wctx.lineTo(g1.x, g1.y); wctx.lineTo(g2.x, g2.y); wctx.lineTo(g3.x, g3.y);
      wctx.closePath(); wctx.clip();
      
      // Sfondo scuro
      wctx.fillStyle = "#0c0214";
      wctx.fillRect(0, 0, WW, WH);
      
      // Nebula viola dello spazio profondo
      const nebulaX = WW / 2 + Math.sin(st.t * 0.3) * 60;
      const nebulaY = WH / 2 + Math.cos(st.t * 0.2) * 30;
      const radG = wctx.createRadialGradient(nebulaX, nebulaY, 10, nebulaX, nebulaY, 80);
      radG.addColorStop(0, "rgba(128,0,255,0.45)");
      radG.addColorStop(0.5, "rgba(64,0,128,0.22)");
      radG.addColorStop(1, "rgba(0,0,0,0)");
      wctx.fillStyle = radG;
      wctx.fillRect(0, 0, WW, WH);
      
      // Pioggia matrix verde
      wctx.fillStyle = "#39ff14";
      for (let i = 0; i < st.matrix.length; i++) {
        const col = st.matrix[i];
        const wx = lerp(g0.x, g1.x, col.u);
        const wy = lerp(g0.y, g3.y, col.y);
        for (let j = 0; j < 5; j++) {
          wctx.globalAlpha = (1 - j * 0.2) * 0.85;
          wctx.fillRect(wx, wy - j * 9, 2, 6);
        }
      }
      wctx.restore();
      wctx.globalAlpha = 1;
      
      // Disegna i glifi esoterici sui poster
      const drawPosterGlyph = (rect, col) => {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        wctx.save();
        wctx.strokeStyle = col;
        wctx.lineWidth = 1.5;
        wctx.shadowColor = col;
        wctx.shadowBlur = 6;
        wctx.globalAlpha = 0.5 + 0.3 * Math.sin(st.t * 6);
        wctx.beginPath();
        wctx.moveTo(cx, cy - 10);
        wctx.lineTo(cx - 8, cy + 6);
        wctx.lineTo(cx + 8, cy + 6);
        wctx.closePath();
        wctx.stroke();
        wctx.beginPath();
        wctx.arc(cx, cy + 1, 3, 0, Math.PI * 2);
        wctx.fillStyle = col;
        wctx.fill();
        wctx.restore();
      };
      
      const brandEgg = eggs.find((eg) => eg.key === "posterBrand");
      const mirrorEgg = eggs.find((eg) => eg.key === "mirror");
      if (brandEgg) drawPosterGlyph(brandEgg.rect, "#ff00ff");
      if (mirrorEgg) drawPosterGlyph(mirrorEgg.rect, "#00ffff");
    }

    // orme sul tappeto (svaniscono in 4s)
    if (fx.prints) for (const pr of st.prints) {
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
    // bacheca (sempre dietro alle entità, solo Sala Tornei)
    if (isTour) {
      if (st.nearObj && st.nearObj.id === "board" && !st.modal) drawGlow(sils.board, boardSp.wx, boardSp.wy);
      wctx.drawImage(boardSp.cv, boardSp.wx, boardSp.wy);
    }
    // entità + avatar in profondità
    // da seduto l'avatar va dietro alla sedia (testa e spalle oltre lo schienale)
    const avDepthX = st.av.seated && !st.av.to ? st.av.fx - 0.31 : st.av.fx;
    const avBox = { avatar: true, minX: avDepthX - 0.01, maxX: avDepthX + 0.01, minY: st.av.fy - 0.01, maxY: st.av.fy + 0.01 };
    const catBox = isTour ? { cat: true, minX: st.cat.fx - 0.01, maxX: st.cat.fx + 0.01, minY: st.cat.fy - 0.01, maxY: st.cat.fy + 0.01 } : null;
    const dogBox = isTour ? { dog: true, minX: st.dog.fx - 0.01, maxX: st.dog.fx + 0.01, minY: st.dog.fy - 0.01, maxY: st.dog.fy + 0.01 } : null;
    const drawCatOnFurniture = isTour && !!(st.cat.perch && CAT_PERCH_SPOTS[st.cat.perch.key]);
    const dyn = isTour ? (drawCatOnFurniture ? [avBox, dogBox] : [avBox, catBox, dogBox]) : [avBox];
    if (isTour && st.ghost) dyn.push({ ghost: true, minX: GHOST_TILE.cx - 0.01, maxX: GHOST_TILE.cx + 0.01, minY: GHOST_TILE.cy - 0.01, maxY: GHOST_TILE.cy + 0.01 });
    if (isTour && st.tut.active) { const sp = updateSpettro(); dyn.push({ spettro: true, minX: sp.fx - 0.01, maxX: sp.fx + 0.01, minY: sp.fy - 0.01, maxY: sp.fy + 0.01 }); }
    const sorted = entities.concat(dyn).sort(cmpDepth);
    const plantIdx = [0, 1, 2, 1][Math.floor(st.t * 1.4) % 4];
    const turnIdx = sfx.musicOn() ? Math.floor(st.t * 7) % 4 : 0;
    const flick = st.t < st.flicker.until;
    const pcAlert = isTour && st.alert > st.t && !st.modal;
    for (const e of sorted) {
      if (e.avatar) { drawAvatarSprite(); continue; }
      if (e.cat) { drawCatSprite(); continue; }
      if (e.dog) { drawDogSprite(); continue; }
      if (e.ghost) { drawGhostSprite(); continue; }
      if (e.spettro) { drawSpettroCompanion(); continue; }
      const spr = e.frames ? e.frames[e.key === "turn" ? turnIdx : plantIdx] : e.spr;
      const x = Math.round(e.anchor.x - spr.ax), y = Math.round(e.anchor.y - spr.ay);
      if (e.inter && ((st.nearObj && st.nearObj.id === e.inter) || (e.inter === "pc" && pcAlert)) && !st.modal) {
        drawGlow(sils[e.inter], x, y, e.inter === "pc" && pcAlert ? 1.9 : 1);
      }
      if (e.key === "turn" && (st.hover.decor === "music" || sfx.musicOn())) drawGlow(turnSil, x, y, sfx.musicOn() ? 0.6 : 1);
      
      // Sedia rotante (oscillazione ammortizzata se urtata)
      let angle = 0;
      if (e.key === "chair" && fx.chairSpin && st.chairSpin > 0 && st.t - st.chairSpin < 2.5) {
        const elapsed = st.t - st.chairSpin;
        angle = Math.sin(elapsed * 10) * 0.16 * Math.exp(-elapsed * 1.5);
      }
      
      wctx.save();
      if (angle !== 0) {
        const cx = e.anchor.x;
        const cy = e.anchor.y - 12;
        wctx.translate(cx, cy);
        wctx.rotate(angle);
        wctx.translate(-cx, -cy);
      }
      wctx.drawImage(spr.cv, x, y);
      wctx.restore();
      
      if (e.key === "chair" && drawCatOnFurniture && st.cat.perch.key === "chair") drawCatSprite();
      if (e.key === "desk") {
        drawMonitorScreen(fx.flicker && (flick || pcAlert));
        if (drawCatOnFurniture && st.cat.perch.key === "desk") drawCatSprite();
      }
      if (e.key === "table") {
        drawTableClock();
        
        // Disegna le carte sparpagliate da Missy
        if (fx.scatter) for (const card of st.scatter) {
          const age = st.t - card.t0;
          wctx.save();
          wctx.translate(card.x, card.y);
          wctx.rotate(card.rot);
          wctx.globalAlpha = clamp((12 - age) * 0.5, 0, 1);
          wctx.fillStyle = "#10142a";
          wctx.fillRect(-4, -6, 8, 12);
          wctx.fillStyle = "#f5f0e2";
          wctx.fillRect(-3, -5, 6, 10);
          wctx.fillStyle = card.col;
          wctx.fillRect(-2, -3, 4, 6);
          wctx.restore();
        }
        wctx.globalAlpha = 1;

        // Disegna l'animazione di smazzata se siamo AFK al tavolo
        if (st.afkShuffle && fx.cssAnimations) {
          const tCenter = tablePt(7.0, 3.0);
          const drawMiniDeck = (dx, dy, col, n = 4) => {
            for (let i = 0; i < n; i++) {
              wctx.fillStyle = "#10142a";
              wctx.fillRect(dx - 5, dy - 7 - i * 1.5, 10, 14);
              wctx.fillStyle = col;
              wctx.fillRect(dx - 4, dy - 6 - i * 1.5, 8, 12);
            }
          };
          const elapsed = st.t - st.afkShuffle.t0;
          const p1 = { x: tCenter.x - 26, y: tCenter.y };
          const p2 = { x: tCenter.x + 26, y: tCenter.y };
          const midX = (p1.x + p2.x) / 2;
          
          drawMiniDeck(p1.x, p1.y, "#d94f46", 2);
          drawMiniDeck(p2.x, p2.y, "#4a7fd6", 2);
          
          const nCards = 6;
          for (let i = 0; i < nCards; i++) {
            const tCard = (elapsed * 2.5 - (i / nCards)) % 1;
            if (tCard < 0 || tCard > 1) continue;
            const side = i % 2 === 0 ? -1 : 1;
            const startX = midX + side * 26;
            const x = lerp(startX, midX, tCard);
            const h = Math.sin(tCard * Math.PI) * 16;
            const y = tCenter.y - h;
            
            wctx.save();
            wctx.translate(x, y);
            wctx.rotate(tCard * side * 0.8);
            wctx.fillStyle = i % 2 === 0 ? "#d94f46" : "#4a7fd6";
            wctx.fillRect(-4, -6, 8, 12);
            wctx.fillStyle = "#fff";
            wctx.fillRect(-3, -5, 6, 10);
            wctx.restore();
          }
          drawMiniDeck(midX, tCenter.y, P.gold, Math.floor((elapsed * 4) % 12));
        }

        // Disegna le fasi di Hype (split, deal) sul tavolo
        if (st.hype) {
          const tCenter = tablePt(7.0, 3.0);
          const drawMiniDeck = (dx, dy, col, n = 4) => {
            for (let i = 0; i < n; i++) {
              wctx.fillStyle = "#10142a";
              wctx.fillRect(dx - 5, dy - 7 - i * 1.5, 10, 14);
              wctx.fillStyle = col;
              wctx.fillRect(dx - 4, dy - 6 - i * 1.5, 8, 12);
            }
          };
          
          if (st.hype.phase === "split") {
            const elapsed = st.t - st.hype.t0;
            const k = clamp(elapsed / 1.0, 0, 1);
            const dx = k * 12;
            const lift = Math.sin(k * Math.PI) * 4;
            drawMiniDeck(tCenter.x - 14 - dx, tCenter.y - lift, "#d94f46");
            drawMiniDeck(tCenter.x + 14 + dx, tCenter.y - lift, "#4a7fd6");
          }
          else if (st.hype.phase === "deal" && st.hype.deals) {
            for (const card of st.hype.deals) {
              wctx.save();
              wctx.translate(card.x, card.y);
              wctx.rotate(card.rot);
              wctx.fillStyle = "#10142a";
              wctx.fillRect(-5, -7.5, 10, 15);
              wctx.fillStyle = "#f5f0e2";
              wctx.fillRect(-4, -6.5, 8, 13);
              wctx.fillStyle = card.color;
              wctx.fillRect(-2.5, -4.5, 5, 9);
              wctx.restore();
            }
          }
        }
        if (drawCatOnFurniture && st.cat.perch.key === "table") drawCatSprite();
      }
    }
    /* — busta lettere sul pavimento (slide / idle) — */
    if (isTour && st.letter && (st.letter.phase === "slide" || st.letter.phase === "idle")) {
      const lt = st.letter;
      wctx.save();
      const glow = lt.phase === "idle" ? 0.35 + 0.15 * Math.sin(st.t * 8) : 0.2;
      const pgG = wctx.createRadialGradient(lt.x, lt.y, 2, lt.x, lt.y, 18);
      pgG.addColorStop(0, "rgba(243, 199, 106, " + glow + ")");
      pgG.addColorStop(1, "rgba(243, 199, 106, 0)");
      wctx.fillStyle = pgG;
      wctx.beginPath();
      wctx.ellipse(lt.x, lt.y + 6, 14, 5, 0, 0, Math.PI * 2);
      wctx.fill();
      drawLetterEnvelope(wctx, lt.x, lt.y, { rot: lt.rot || 0 });
      wctx.restore();
    }
    /* — riflesso notturno dell'avatar nella finestra — */
    if (isTour && phase.id === "night" && st.avDraw && fx.reflections) {
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
    if (isTour && phase.amb) { wctx.fillStyle = phase.amb; wctx.fillRect(0, 0, WW, WH); }
    /* — dinamici — */
    if (isTour && fx.glows) {
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
    }
    // pulviscolo nella luce
    if (isTour && fx.motes) {
      const A = wallL(5.9, 0), B = wallL(7.5, 0);
      for (const m of st.motes) {
        const bx = lerp(A.x, B.x, m.u), by = lerp(A.y, B.y, m.u);
        const x = bx + m.v * 4.6 * HTW + Math.sin(st.t * 1.3 + m.ph) * 3;
        const y = by + m.v * 4.6 * HTH - m.lift;
        const a = Math.max(0, Math.sin(Math.PI * m.v)) * (0.22 + 0.18 * Math.sin(st.t * 2 + m.ph));
        if (a > 0.02) { wctx.fillStyle = "rgba(255,250,225," + a.toFixed(3) + ")"; wctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
      }
    }
    // frecce guida + etichette: disegnate in screen-space (testo nitido) più sotto

    /* — LED del citofono (verde fisso, rosso lampeggiante quando suona) — */
    if (isTour) {
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

    // Disegna le carte caotiche sullo schermo intero sotto la stanza
    if (st.shadow && st.shadowCards) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const card of st.shadowCards) {
        drawShadowCard(ctx, card);
      }
    }

    const s = scale * st.cam.z * dpr;
    ctx.imageSmoothingEnabled = scale * st.cam.z < 1;
    const shX = st.shake > 0 ? (Math.random() - 0.5) * st.shake : 0;
    const shY = st.shake > 0 ? (Math.random() - 0.5) * st.shake : 0;
    ctx.setTransform(s, 0, 0, s, canvas.width / 2 - st.cam.x * s + shX, canvas.height / 2 - st.cam.y * s + shY);
    ctx.drawImage(world, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    /* — fade cambio stanza (neon pink, V-shape: 0→1 al midpoint, poi 1→0) — */
    if (st.transition) {
      const p = st.transition.t / 0.8;
      const alpha = p < 0.5 ? p * 2 : 2 - p * 2;
      ctx.fillStyle = "rgba(13,13,26," + alpha.toFixed(3) + ")";
      ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      if (alpha > 0.5) {
        ctx.fillStyle = "rgba(255,42,109," + ((alpha - 0.5) * 0.8).toFixed(3) + ")";
        ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    }

    /* — layer schermo: tooltip + fumetto (testo nitido) — */
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
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

    /* — frecce guida + etichette sopra gli oggetti (sempre visibili, solo Sala Tornei) — */
    if (isTour && !st.photoHide) {
      const GUIDE = {
        pc:    "Partecipa ad un torneo",
        board: "Crea un nuovo torneo privato",
        decks: "Monta il tuo mazzo",
      };
      for (const id of ["pc", "decks", "board"]) {
        if (st.modal === id) continue;
        // niente doppione: se il tooltip di hover è già su questo oggetto, salta l'etichetta
        if (st.nearObj && st.nearObj.id === id && !st.modal && !st.lock) continue;
        const sp = project(ICON_POS[id].x, ICON_POS[id].y);
        const alertMe = id === "pc" && st.alert > st.t;
        const nearMe = st.nearObj && st.nearObj.id === id;
        const ph = id === "pc" ? 0 : id === "decks" ? 2.1 : 4.2;
        const bob = Math.sin(st.t * (alertMe ? 6 : 2.4) + ph) * (alertMe ? 5 : 3);
        const accent = alertMe ? "#ff8a3d" : "#ffd76e";
        const emph = alertMe || nearMe;
        const tipY = sp.y + bob;          // punta della freccia (poco sopra l'oggetto)
        // etichetta (un filo più grande e leggibile)
        ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
        const tw = ctx.measureText(GUIDE[id]).width;
        const padX = 14, lh = 31, arrowH = 17, gap = 6;
        const lw = tw + padX * 2;
        const aBase = tipY - 4 - arrowH;          // base della freccia
        let ly = aBase - gap - lh;                // top etichetta
        let lx = clamp(sp.x - lw / 2, 8, w - lw - 8);
        if (ly < 6) ly = 6;
        // freccia (triangolo verso il basso) con bordo scuro
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.moveTo(sp.x - 11, aBase);
        ctx.lineTo(sp.x + 11, aBase);
        ctx.lineTo(sp.x, tipY - 4);
        ctx.closePath();
        ctx.fillStyle = accent; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(20,16,30,0.85)"; ctx.stroke();
        ctx.restore();
        // pillola etichetta
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
        rr(ctx, lx, ly, lw, lh, 10);
        ctx.fillStyle = "rgba(18,20,36,0.94)"; ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        ctx.lineWidth = emph ? 2 : 1.5;
        ctx.strokeStyle = emph ? accent : "rgba(255,255,255,0.22)"; ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "#fff3d6";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText(GUIDE[id], lx + lw / 2, ly + lh / 2 + 0.5);
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      }

      /* — etichetta specchio "Personalizza l'avatar" (stesso stile guide, screen-space) — */
      if (st.modal !== "mirror") {
        const mEgg = eggs.find((e) => e.key === "mirror");
        if (mEgg) {
          const mr = mEgg.rect;
          const mp = project(mr.x + mr.w / 2, mr.y);
          const label = "Personalizza l'avatar";
          const bob = Math.sin(st.t * 2.4 + 1.1) * 3;
          const accent = "#ffd76e";
          const tipY = mp.y + bob;
          ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
          const tw = ctx.measureText(label).width;
          const padX = 14, lh = 31, arrowH = 17, gap = 6;
          const lw = tw + padX * 2;
          const aBase = tipY - 4 - arrowH;
          let ly = aBase - gap - lh;
          let lx = clamp(mp.x - lw / 2, 8, w - lw - 8);
          if (ly < 6) ly = 6;
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
          ctx.beginPath();
          ctx.moveTo(mp.x - 11, aBase);
          ctx.lineTo(mp.x + 11, aBase);
          ctx.lineTo(mp.x, tipY - 4);
          ctx.closePath();
          ctx.fillStyle = accent; ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.lineWidth = 2; ctx.strokeStyle = "rgba(20,16,30,0.85)"; ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.4)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
          rr(ctx, lx, ly, lw, lh, 10);
          ctx.fillStyle = "rgba(18,20,36,0.94)"; ctx.fill();
          ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.stroke();
          ctx.restore();
          ctx.fillStyle = "#fff3d6";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.font = "700 14px 'Segoe UI', system-ui, sans-serif";
          ctx.fillText(label, lx + lw / 2, ly + lh / 2 + 0.5);
          ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        }
      }
    }

    if (st.bubble && !st.photoHide) {
      const age = st.t - st.bubble.t0;
      const pop = easeOutBack(clamp(age * 4, 0, 1));
      const fade = clamp((st.bubble.dur - age) * 2, 0, 1);
      const isCat = st.bubble.target === "cat";
      const isDog = st.bubble.target === "dog";
      const c = isCat ? tileTop(st.cat.fx, st.cat.fy) : (isDog ? tileTop(st.dog.fx, st.dog.fy) : tileTop(st.av.fx, st.av.fy));
      const lift = (isCat && st.cat.perch) ? st.cat.perch.lift : ((isDog && st.dog.perch) ? st.dog.perch.lift : 0);
      const pt = project(c.x, c.y + HTH - 48 - lift);
      ctx.font = "600 14px 'Segoe UI', system-ui, sans-serif";
      const tw2 = ctx.measureText(st.bubble.text).width;
      const bw = (tw2 + 26) * pop, bh = 32 * pop;
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
        ctx.font = "600 " + Math.round(14 * pop) + "px 'Segoe UI', system-ui, sans-serif";
        ctx.fillText(st.bubble.text, bx + 13, by + bh / 2 + 5);
      }
      ctx.globalAlpha = 1;
    }
    /* — busta lettere: overlay ricompensa crediti fullscreen — */
    if (letterOverlayActive()) {
      const lt = st.letter;
      ctx.save();
      if (st.shake > 0) {
        const sx = (Math.random() - 0.5) * st.shake;
        const sy = (Math.random() - 0.5) * st.shake;
        ctx.translate(sx, sy);
      }
      ctx.fillStyle = "rgba(10, 12, 22, 0.88)";
      ctx.fillRect(0, 0, w, h);

      const centerX = w / 2;
      const centerY = h / 2;
      const uiS = Math.min(w / 340, h / 330, 2.8);

      if (lt.phase === "lift") {
        const elapsed = st.t - lt.t0;
        const k = easeOutBack(clamp(elapsed / 1.05, 0, 1));
        const envS = lerp(0.6, 5.2, easeOutQuad(k));
        const yOff = lerp(h * 0.18, -24, k);
        const rot = (1 - k) * 0.22 * Math.sin(elapsed * 9);
        const glow = k * 0.35;
        /* scia di particelle oro durante la salita */
        if (Math.random() < 0.6) {
          st.letterFx.push({
            x: centerX + (Math.random() - 0.5) * 26 * envS,
            y: centerY + yOff + 14 * envS,
            vx: (Math.random() - 0.5) * 24, vy: 18 + Math.random() * 22,
            col: Math.random() < 0.6 ? "#F3C76A" : "#ffe6a8",
            size: 1.6 + Math.random() * 2.2,
            dur: 0.5 + Math.random() * 0.35, t0: st.t, grav: 30,
          });
        }
        drawLetterEnvelope(ctx, centerX, centerY + yOff, {
          scale: envS, rot, glow, flapOpen: 0, sealBreak: 0,
        });
      } else if (lt.phase === "open") {
        const elapsed = st.t - lt.t0;
        const openK = clamp(elapsed / 1.35, 0, 1);
        const sealBreak = easeOutQuad(clamp(openK / 0.32, 0, 1));
        const flapOpen = easeOutCubic(clamp((openK - 0.18) / 0.72, 0, 1));
        const glow = flapOpen > 0.55 ? (flapOpen - 0.55) * 2.2 : sealBreak * 0.4;
        const wobble = Math.sin(elapsed * 14) * (1 - flapOpen) * 2.5;
        /* fascio di luce oro sopra il flap che cresce con l'apertura */
        if (flapOpen > 0.05) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const beamY = centerY - 28 - 52;
          const beamA = 0.18 * flapOpen;
          const bg = ctx.createRadialGradient(centerX + wobble, beamY, 4, centerX + wobble, beamY, 120 * flapOpen + 30);
          bg.addColorStop(0, "rgba(255, 233, 160, " + beamA.toFixed(3) + ")");
          bg.addColorStop(0.5, "rgba(243, 199, 106, " + (beamA * 0.5).toFixed(3) + ")");
          bg.addColorStop(1, "rgba(243, 199, 106, 0)");
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.ellipse(centerX + wobble, beamY, 90 * flapOpen + 24, 140 * flapOpen + 30, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        /* one-shot: piccolo burst schegge oro al break del sigillo */
        if (sealBreak > 0.5 && !lt.sealBurstFx) {
          lt.sealBurstFx = true;
          const sx = centerX + wobble, sy = centerY - 28 - 36;
          burstLetterFx(sx, sy, 18);
          st.letterFx.push({ x: sx, y: sy, ring: true, maxRadius: 60, col: "#F3C76A", dur: 0.5, t0: st.t });
        }
        drawLetterEnvelope(ctx, centerX + wobble, centerY - 28, {
          scale: 5.2, flapOpen, sealBreak, glow,
        });
        if (flapOpen < 0.95) {
          ctx.fillStyle = "#F3C76A";
          ctx.font = "bold 11px 'Press Start 2P', monospace";
          ctx.textAlign = "center";
          ctx.globalAlpha = 0.85 + 0.15 * Math.sin(st.t * 6);
          ctx.fillText("CLICCA PER APRIRE 📬", centerX, centerY + 100 * uiS);
          ctx.globalAlpha = 1;
        }
      } else if (lt.phase === "reveal" || lt.phase === "done") {
        const elapsed = st.t - lt.t0;
        const revealK = lt.phase === "done" ? 1 : clamp(elapsed / 1.35, 0, 1);
        /* flash oro fullscreen breve all'inizio del reveal */
        if (elapsed < 0.25) {
          ctx.fillStyle = "rgba(243, 199, 106, " + (0.18 * (1 - elapsed / 0.25)).toFixed(3) + ")";
          ctx.fillRect(0, 0, w, h);
        }
        const envFade = 1 - easeOutQuad(Math.min(revealK * 1.4, 1));
        const envY = centerY + lerp(-28, 72, easeOutQuad(revealK));
        const envS = lerp(5.2, 2.8, easeOutQuad(revealK));
        if (envFade > 0.05) {
          ctx.globalAlpha = envFade * 0.75;
          drawLetterEnvelope(ctx, centerX, envY, {
            scale: envS, flapOpen: 1, sealBreak: 1, glow: 0.15 * envFade,
          });
          ctx.globalAlpha = 1;
        }
        const emerge = easeOutBack(revealK);
        const rewardY = centerY + lerp(48, -8, emerge);
        drawCreditsReward(
          ctx,
          centerX,
          rewardY,
          lt.tournamentName,
          lt.creditsBefore,
          lt.creditsAfter,
          revealK,
          uiS,
          st.t,
          lt.phase === "done",
          { ebartexHover: !!lt.ebartexHover }
        );
        /* hit rect del link "Ebartex" in coordinate screen (solo a done) per click/hover */
        if (lt.phase === "done") {
          ctx.font = "600 11px 'Segoe UI', system-ui, sans-serif";
          const prefix = "Credito pronto sul portale ";
          const linkText = "Ebartex";
          const suffix = ".";
          const wPrefix = ctx.measureText(prefix).width;
          const wLink = ctx.measureText(linkText).width;
          const wSuffix = ctx.measureText(suffix).width;
          const wTotal = wPrefix + wLink + wSuffix;
          const linkXstart = -wTotal / 2 + wPrefix;
          const linkCx = centerX + (linkXstart + wLink / 2) * uiS;
          const linkCy = rewardY + 80 * uiS;
          lt.ebartexHitRect = {
            x: linkCx - (wLink * uiS) / 2 - 6,
            y: linkCy - 9 * uiS,
            w: wLink * uiS + 12,
            h: 18 * uiS,
          };
        }
        if (fx.holo && revealK > 0.15) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.28 * revealK;
          const cardH = CREDITS_REWARD_CARD.h * uiS * emerge;
          const sweepX = centerX - cardH + ((st.t * 140) % (cardH * 2.2));
          const sg = ctx.createLinearGradient(sweepX, rewardY - cardH / 2, sweepX + 50, rewardY + cardH / 2);
          sg.addColorStop(0, "rgba(255,255,255,0)");
          sg.addColorStop(0.5, "rgba(255,233,176,0.9)");
          sg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = sg;
          ctx.fillRect(centerX - 140 * uiS, rewardY - cardH / 2, 280 * uiS, cardH);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    /* — particelle confetti busta lettere (screen-space) — */
    st.letterFx = st.letterFx.filter((p) => st.t - p.t0 < p.dur);
    for (const p of st.letterFx) {
      const k = (st.t - p.t0) / p.dur;
      ctx.globalAlpha = Math.max(0, 1 - k);
      if (p.ring) {
        ctx.strokeStyle = p.col;
        ctx.lineWidth = 2.5 * (1 - k);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.maxRadius * k, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.col;
        const gy = p.grav ? p.grav * k * k : 0;
        ctx.fillRect(p.x + p.vx * k, p.y + p.vy * k + gy, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    /* — flash della foto — */
    if (st.flash && st.t - st.flash < 0.25) {
      ctx.fillStyle = "rgba(255,255,255," + (0.5 * (1 - (st.t - st.flash) / 0.25)).toFixed(3) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
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
    if (!st.afk && !st.afkGoing && !st.afkShuffle && !st.afkShuffleGoing) return;
    const wasMeditating = st.afk || st.afkShuffle;
    st.afk = false; st.afkGoing = false;
    st.afkShuffle = null; st.afkShuffleGoing = false;
    if (wasMeditating) {
      sfx.success();
      showBubble(AFK_LINES[Math.floor(Math.random() * AFK_LINES.length)], 3.5);
      const ap = tileTop(st.av.fx, st.av.fy);
      spawnFx("spark", ap.x, ap.y - 36, 4);
    }
  }

  function onPointerDown(e) {
    sfx.ensure();
    if (st.destroyed) return;
    
    // Intercetta i click se la sequenza busta lettere è attiva (overlay)
    if (letterOverlayActive()) {
      const p = pointerPos(e);
      const hx = p.x;
      const hy = p.y;
      const centerX = st.view.w / 2;
      const centerY = st.view.h / 2;
      const lt = st.letter;

      if (lt.phase === "lift") {
        lt.phase = "open";
        lt.t0 = st.t - 1.1;
        st.shake = 6;
        return;
      }
      if (lt.phase === "open") {
        advanceLetterToReveal();
        return;
      }
      if (lt.phase === "done") {
        const uiS = Math.min(st.view.w / 340, st.view.h / 330, 2.8);
        const rewardY = centerY - 8;
        const scale = uiS;
        const btnCy = rewardY + CREDITS_REWARD_CARD.btnCy * scale;
        const btnW = CREDITS_REWARD_CARD.btnW * scale;
        const btnH = CREDITS_REWARD_CARD.btnH * scale;
        /* click sul link "Ebartex" → apre la sezione crediti del portale */
        if (lt.ebartexHitRect) {
          const r = lt.ebartexHitRect;
          if (hx >= r.x && hx <= r.x + r.w && hy >= r.y && hy <= r.y + r.h) {
            sfx.click();
            try { window.open(EBARTEX_CREDITO_URL, "_blank", "noopener,noreferrer"); }
            catch (_) { /* ignore */ }
            return;
          }
        }
        if (Math.abs(hx - centerX) < btnW / 2 + 8 && Math.abs(hy - btnCy) < btnH / 2 + 8) {
          closeLetterReward();
        }
        return;
      }
      return;
    }

    if (st.modal || st.lock || st.cinematic) return;
    st.lastAct = st.t;
    wakeAfk();
    const p = pointerPos(e);
    const dec = st.room === "tournament" ? hitDecor(p.x, p.y) : null;
    if (dec) {
      if (dec.kind === "letter") { startLetterOpening(); return; }
      if (dec.kind === "music") { clickObject({ ...MUSIC_OBJ }); return; }
      if (dec.kind === "cat") { petCat(); return; }
      if (dec.kind === "dog") { petDog(); return; }
      if (dec.kind === "intercom") {
        sfx.click();
        if (!st.ringTest && !(st.ring && st.t < st.ring.until)) {
          st.ringTest = st.t + 3;
          showBubble("📯 Citofono: test in corso… resta in ascolto!", 2.6);
        }
        return;
      }
      if (dec.kind === "egg") {
        if (dec.egg.key === "mirror") { openMirror(); return; }
        eggClick(dec.egg); return;
      }
    }
    const obj = hitObject(p.x, p.y);
    if (obj) { clickObject(obj); return; }
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
    st.pointer.x = p.x;
    st.pointer.y = p.y;
    /* hover link "Ebartex" nell'overlay busta (fase done) */
    if (letterOverlayActive() && st.letter && st.letter.phase === "done" && st.letter.ebartexHitRect) {
      const r = st.letter.ebartexHitRect;
      st.letter.ebartexHover = p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
      canvas.style.cursor = st.letter.ebartexHover ? "pointer" : "default";
      return;
    }
    const dec = hitDecor(p.x, p.y);
    const obj = dec ? null : hitObject(p.x, p.y);
    st.hover.decor = dec ? dec.kind : null;
    st.hover.obj = obj ? obj.id : null;
    canvas.style.cursor = (obj || dec) && !st.modal && !st.lock ? "pointer" : "default";
    if (!obj && !dec) {
      const wpt = unproject(p.x, p.y);
      const tl = worldToTile(wpt.x, wpt.y);
      st.hover.tile = inGrid(tl.cx, tl.cy) && !blocked.has(tkey(tl.cx, tl.cy)) ? tl : null;
    } else st.hover.tile = null;
  }
  function onPointerLeave() { st.hover.tile = null; st.hover.obj = null; }
  function onKeyDown(e) {
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || st.modal || st.cinematic) return;
    /* ESC nella Sala Arcade → torna alla Sala Tornei */
    if (e.key === "Escape" && !st.lock && st.room === "arcade") {
      e.preventDefault();
      changeRoom("tournament");
      return;
    }
    /* P = modalità foto */
    if (e.code === "KeyP" && !st.lock) {
      e.preventDefault();
      sfx.ensure();
      st.lastAct = st.t;
      takePhoto();
      return;
    }
    /* hotkey dirette: 1/2/3 oggetti (mappati per stanza) */
    if (!st.lock && (e.code === "Digit1" || e.code === "Digit2" || e.code === "Digit3" || e.code === "Digit4")) {
      const which = e.code === "Digit1" ? 1 : e.code === "Digit2" ? 2 : e.code === "Digit3" ? 3 : 4;
      const target = st.room === "arcade"
        ? (which === 1 ? inter.arcade1 : which === 2 ? inter.arcade2 : which === 3 ? inter.arcade3 : inter.kakegurui)
        : (which === 1 ? inter.pc : which === 2 ? inter.decks : inter.board);
      if (!target) return;
      e.preventDefault();
      sfx.ensure();
      st.lastAct = st.t;
      wakeAfk();
      teleportInteract(target);
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
    const dpr = fx.dpr;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    // riempie più spazio (laterale + un po' di altezza) lasciando un margine minimo
    st.view = { w, h, dpr, scale: Math.max(0.3, Math.min(w / WW, h / WH)) * 1.1 };
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
    setQuality(q) {
      if (st.destroyed) return;
      fx = getFxFlags(q);
      resize();
    },
    /* eventi diegetici dall'esterno (cambi nei tornei, sfide, ecc.) */
    notify() { if (!st.destroyed) { st.alert = st.t + 6; sfx.success(); } },
    ring(msg) { if (!st.destroyed) doRing(msg || "C'è qualcuno al citofono!"); },
    setCountdown(epochMs) { st.countdown = epochMs || null; st.cdRang = false; },
    setGhost(name) { st.ghost = name || null; },
    setBracket(on) {
      if (st.destroyed || st.room !== "tournament") return;
      if (bracketOn === on) return;
      bracketOn = on;
      boardSp = buildBoard(on);
      inter.board.hitRect = { x: boardSp.wx, y: boardSp.wy, w: boardSp.cv.width, h: boardSp.cv.height * 0.64 };
      sils.board = makeSil({ cv: boardSp.cv });
    },
    takePhoto,
    skipTutorial() { if (!st.destroyed) endTutorial(); },
    restartTutorial() { if (!st.destroyed) tutRestart(); },
    /* — specchio: applica il look scelto ricostruendo gli sprite dell'avatar — */
    setLook(look) {
      if (st.destroyed || !look) return;
      currentLook = { ...currentLook, ...look };
      avatar = buildAvatar(currentLook);
    },
    getLook() { return { ...currentLook }; },
    /* anteprima statica (vista frontale) su un canvas fornito dalla modale */
    drawLookPreview(canvasEl, look) {
      if (st.destroyed || !canvasEl) return;
      try {
        const av = buildAvatar({ ...currentLook, ...(look || {}) });
        const sp = av.se.idle[0];
        const cx = canvasEl.getContext("2d");
        cx.imageSmoothingEnabled = false;
        cx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        const s = Math.max(1, Math.floor(Math.min(canvasEl.width / sp.cv.width, canvasEl.height / sp.cv.height)));
        const dw = sp.cv.width * s, dh = sp.cv.height * s;
        cx.drawImage(sp.cv, Math.round((canvasEl.width - dw) / 2), Math.round((canvasEl.height - dh) / 2), dw, dh);
      } catch (e) { /* canvas non pronto */ }
    },
    /* stessa azione dei tasti 1/2/3/4/P, ma cliccando i badge a schermo */
    hotkey(which) {
      if (st.destroyed || st.modal || st.cinematic || st.lock) return;
      sfx.ensure();
      st.lastAct = st.t;
      wakeAfk();
      if (which === "P") { takePhoto(); return; }
      const target = st.room === "arcade"
        ? (which === 1 ? inter.arcade1 : which === 2 ? inter.arcade2 : which === 3 ? inter.arcade3 : which === 4 ? inter.kakegurui : null)
        : (which === 1 ? inter.pc : which === 2 ? inter.decks : which === 3 ? inter.board : null);
      if (!target) return;
      teleportInteract(target);
      hideHintOnce();
    },
    powerOff() { if (!st.destroyed) sfx.close(); },
    zoomOut() {
      if (st.destroyed) return;
      sfx.close();
      st.modal = null;
      st.lastAct = st.t;
      st.lock = true;
      const cam = st.room === "arcade" ? ARC_DEFAULT_CAM : DEFAULT_CAM;
      camTo(cam, 0.55, () => {
        st.lock = false;
        if (st.av.seated) {
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
  ".irg-controls{position:absolute;top:12px;right:16px;z-index:10;display:flex;align-items:center;gap:18px;padding:8px 14px;background:rgba(10,12,22,.55);border:1px solid rgba(255,255,255,.12);border-radius:14px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);}",
  ".irg-mute{width:40px;height:40px;border:0;border-radius:10px;background:rgba(255,255,255,.06);",
  "color:rgba(255,255,255,.75);cursor:pointer;display:flex;align-items:center;justify-content:center;",
  "line-height:0;transition:color .2s,background-color .2s,transform .15s ease,border-color .2s;",
  "border:1px solid rgba(255,255,255,.08);}",
  ".irg-mute:hover{color:#fff;background-color:rgba(255,115,0,.2);border-color:rgba(255,115,0,.4);transform:scale(1.05);}",
  ".irg-mute:active{transform:scale(.95);}",
  ".irg-quality{height:40px;border:0;border-radius:10px;background:rgba(255,255,255,.06);",
  "border:1px solid rgba(255,255,255,.12);color:#ffe9b0;cursor:pointer;display:flex;align-items:center;",
  "justify-content:center;gap:5px;padding:0 16px;font-family:'Press Start 2P','Courier New',monospace;",
  "font-size:9px;letter-spacing:.6px;line-height:1;",
  "transition:color .2s,background-color .2s,transform .15s ease,border-color .2s;}",
  ".irg-quality:hover{background:rgba(255,115,0,.18);border-color:rgba(255,115,0,.45);transform:scale(1.05);}",
  ".irg-quality:active{transform:scale(.95);}",
  ".irg-hint{bottom:14px;left:50%;transform:translateX(-50%);color:#cfd6f5;font-size:8px;",
  "animation:irgHintPulse 2.2s ease-in-out infinite;transition:opacity .6s ease;white-space:nowrap;}",
  ".irg-hint.irg-off{opacity:0;pointer-events:none;}",
  "@keyframes irgHintPulse{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}",
  /* — modale arcade: full-viewport per i minigiochi, nasconde la ✕ (i giochi hanno il proprio back) — */
  ".irg-m-arcade{width:min(1100px,96vw);max-width:96vw;height:calc(100% - 40px);max-height:calc(100% - 40px);",
  "align-self:center;display:flex;flex-direction:column;border-radius:14px;padding:0;overflow:hidden;",
  "border:2px solid rgba(255,42,109,.55);box-shadow:0 0 28px rgba(255,42,109,.3),inset 0 0 14px rgba(0,0,0,.5);",
  "background:radial-gradient(120% 90% at 50% 0%,#16112e 0%,#0a0a16 60%,#050509 100%);}",
  ".irg-m-arcade .irg-x{display:none;}",
  /* — legenda tasti: in basso a sinistra, badge cliccabili per andare in automatico — */
  ".irg-keys{position:absolute;left:18px;bottom:18px;z-index:12;display:flex;",
  "flex-direction:column;gap:7px;font-family:'Press Start 2P','Courier New',monospace;",
  "color:#cfd6f5;user-select:none;pointer-events:none;letter-spacing:.5px;max-width:min(340px,72vw);}",
  ".irg-key{display:flex;align-items:center;gap:9px;width:100%;text-align:left;cursor:pointer;",
  "pointer-events:auto;background:rgba(16,18,32,.62);border:1px solid rgba(255,255,255,.14);",
  "border-radius:10px;padding:7px 10px;color:#eef2ff;backdrop-filter:blur(4px);",
  "transition:background-color .15s,border-color .15s,transform .1s,box-shadow .15s;}",
  ".irg-key span{font-family:'Press Start 2P','Courier New',monospace;font-size:9px;line-height:1.3;}",
  ".irg-key:hover{background:rgba(255,115,0,.18);border-color:rgba(255,214,110,.55);transform:translateX(3px);box-shadow:0 6px 18px rgba(0,0,0,.4);}",
  ".irg-key:active{transform:translateX(1px) scale(.98);}",
  ".irg-key b{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;",
  "background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.35);border-radius:6px;",
  "color:#ffe9b0;font-size:7px;font-weight:400;padding:4px 6px;line-height:1.2;",
  "box-shadow:0 2px 0 rgba(0,0,0,.35);transition:background-color .15s,color .15s,border-color .15s;white-space:nowrap;}",
  ".irg-key:hover b{background:rgba(255,214,110,.92);color:#1a1205;border-color:#ffd76e;}",
  "@media (max-width:900px){.irg-keys{display:none;}}",
  /* — bottone vista semplice (in basso a destra) — */
  ".irg-simple-btn{position:absolute;right:18px;bottom:18px;z-index:12;display:inline-flex;align-items:center;gap:9px;",
  "cursor:pointer;font-family:'Segoe UI',system-ui,sans-serif;font-weight:800;font-size:13.5px;letter-spacing:.2px;",
  "color:#eef2ff;background:linear-gradient(180deg,rgba(28,32,54,.92),rgba(16,18,32,.92));",
  "border:1px solid rgba(255,214,110,.4);border-radius:13px;padding:11px 16px;backdrop-filter:blur(6px);",
  "box-shadow:0 10px 30px rgba(0,0,0,.45);transition:border-color .16s,transform .1s,box-shadow .16s;}",
  ".irg-simple-btn svg{color:#ffd76e;}",
  ".irg-simple-btn:hover{border-color:rgba(255,214,110,.78);transform:translateY(-2px);box-shadow:0 14px 36px rgba(0,0,0,.55);}",
  ".irg-simple-btn:active{transform:translateY(0) scale(.98);}",
  "@media (max-width:560px){.irg-simple-btn{font-size:12px;padding:9px 12px;right:12px;bottom:12px;}}",
  /* — animazione schermo che si spegne (CRT) prima della vista semplice — */
  ".irg-root.irg-powering{pointer-events:none;animation:irgPowerOff .64s cubic-bezier(.7,0,.3,1) forwards;transform-origin:center;background:#000;}",
  "@keyframes irgPowerOff{0%{filter:brightness(1);transform:scale(1);opacity:1}",
  "16%{filter:brightness(2.4) contrast(1.5);transform:scaleY(1.04)}",
  "48%{filter:brightness(1.1);transform:scaleY(.012) scaleX(1);opacity:1}",
  "64%{transform:scaleY(.012) scaleX(.4)}",
  "100%{transform:scaleY(.002) scaleX(0);opacity:0}}",
  /* — tutorial guidato: banner che diventa cartello grande (intro/outro) — */
  ".irg-tut{position:absolute;top:64px;left:50%;transform:translateX(-50%);z-index:60;",
  "width:min(700px,93vw);pointer-events:none;animation:irgTutIn .4s cubic-bezier(.34,1.45,.64,1);",
  "transition:top .6s cubic-bezier(.4,0,.2,1),width .55s cubic-bezier(.4,0,.2,1);}",
  ".irg-tut-bar{pointer-events:auto;display:flex;align-items:center;gap:14px;",
  "background:linear-gradient(180deg,rgba(38,26,15,.97),rgba(22,15,9,.98));",
  "border:1px solid rgba(255,138,42,.42);border-radius:16px;padding:13px 16px;",
  "box-shadow:0 16px 44px rgba(0,0,0,.5),0 0 22px rgba(255,120,20,.12),inset 0 1px 0 rgba(255,180,110,.12);backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);",
  "transition:padding .5s ease,border-radius .5s ease;}",
  ".irg-tut-ghost{flex:0 0 auto;width:46px;height:50px;display:flex;align-items:flex-end;justify-content:center;",
  "transition:width .4s ease,height .4s ease;animation:irgGhostBob 3.2s ease-in-out infinite;",
  "filter:drop-shadow(0 5px 10px rgba(255,110,20,.4));}",
  ".irg-tut-ghost svg{width:100%;height:100%;overflow:visible;}",
  ".irg-ghost-body{fill:#fff7ef;stroke:rgba(255,150,60,.55);stroke-width:1.2;}",
  ".irg-ghost-eye{fill:#3a2a16;}",
  ".irg-ghost-blush{fill:rgba(255,140,60,.5);}",
  ".irg-tut-eyes{transform-origin:8.5px 7.5px;animation:irgGhostBlink 4.4s ease-in-out infinite;}",
  ".irg-tut-text{position:relative;flex:1 1 auto;color:#fdf3e8;font-size:15px;font-weight:600;line-height:1.45;",
  "transition:font-size .45s ease;}",
  ".irg-tut-reserve{visibility:hidden;display:block;white-space:pre-line;}",
  ".irg-tut-typed{position:absolute;inset:0;display:block;}",
  ".irg-tut-word{display:inline-block;white-space:nowrap;}",
  ".irg-tut-sp{white-space:pre;}",
  ".irg-tut-ch{display:inline-block;white-space:pre;animation:irgChIn .22s ease both;}",
  ".irg-tut-brand{color:#FF7300;text-shadow:0 0 12px rgba(255,115,0,.42);}",
  ".irg-tut-intro .irg-tut-brand,.irg-tut-final .irg-tut-brand{text-shadow:0 0 18px rgba(255,115,0,.52);}",
  ".irg-tut-pill{display:inline-block;margin-right:.4em;padding:.2em .72em;border-radius:999px;vertical-align:baseline;",
  "background:linear-gradient(180deg,rgba(255,154,61,.38),rgba(255,115,0,.24));",
  "border:1px solid rgba(255,167,80,.52);box-shadow:0 2px 12px rgba(255,115,0,.22),inset 0 1px 0 rgba(255,255,255,.14);",
  "font-weight:800;font-size:.9em;letter-spacing:.04em;color:#fff3e4;white-space:nowrap;}",
  "@keyframes irgChIn{from{opacity:0;transform:translateY(.16em) scale(.94);filter:blur(.5px)}to{opacity:1;transform:none;filter:none}}",
  ".irg-tut-caret{display:inline-block;width:2px;height:1.05em;margin-left:2px;vertical-align:-2px;",
  "background:#ffb060;border-radius:1px;animation:irgCaret .8s steps(1) infinite;}",
  ".irg-tut-skip{flex:0 0 auto;cursor:pointer;border:1px solid rgba(255,255,255,.22);",
  "background:rgba(255,255,255,.06);color:#cfd6f5;border-radius:9px;padding:9px 13px;font-size:12.5px;",
  "font-weight:700;transition:background-color .18s,color .18s,border-color .18s,transform .12s;white-space:nowrap;}",
  ".irg-tut-skip:hover{background:rgba(255,115,0,.2);border-color:rgba(255,115,0,.45);color:#fff;transform:scale(1.04);}",
  ".irg-tut-skip:active{transform:scale(.96);}",
  ".irg-tut-side{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:5px;}",
  ".irg-tut-dur{font-size:10.5px;font-weight:600;line-height:1.2;color:rgba(207,214,245,.62);letter-spacing:.03em;white-space:nowrap;}",
  ".irg-tut-dur-intro{margin-top:2px;font-size:13px;color:rgba(253,243,232,.58);}",
  /* stato grande: cartello al centro (intro e outro) */
  ".irg-tut-intro{top:36%;width:min(780px,94vw);}",
  ".irg-tut-intro .irg-tut-bar{flex-direction:column;text-align:center;gap:17px;padding:28px 30px;",
  "border-radius:24px;border-color:rgba(129,140,248,.48);box-shadow:0 30px 80px rgba(0,0,0,.62);}",
  ".irg-tut-intro .irg-tut-ghost{width:80px;height:88px;}",
  ".irg-tut-intro .irg-tut-text{font-size:24px;font-weight:800;line-height:1.34;min-height:2.4em;}",
  ".irg-tut-intro .irg-tut-skip{display:none;}",
  /* outro: cartello finale con i bottoni di scelta */
  ".irg-tut-final{top:30%;}",
  ".irg-tut-actions{display:flex;flex-direction:column;align-items:center;gap:13px;width:100%;margin-top:2px;}",
  ".irg-tut-repeat{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;}",
  ".irg-tut-q{font-size:15px;font-weight:700;color:#cfd6f5;}",
  ".irg-tut-btn{cursor:pointer;border-radius:11px;padding:11px 20px;font-size:14.5px;font-weight:800;",
  "font-family:'Segoe UI',system-ui,sans-serif;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);",
  "color:#eef2ff;transition:background-color .16s,border-color .16s,transform .1s,box-shadow .16s;}",
  ".irg-tut-btn:hover{transform:translateY(-2px);box-shadow:0 10px 26px rgba(0,0,0,.45);}",
  ".irg-tut-btn:active{transform:translateY(0) scale(.97);}",
  ".irg-tut-yes{background:linear-gradient(180deg,#2fe08a,#10b46a);color:#06241a;border-color:rgba(255,255,255,.45);}",
  ".irg-tut-yes:hover{border-color:#7dffc2;}",
  ".irg-tut-no{min-width:62px;}",
  ".irg-tut-no:hover{border-color:rgba(255,120,120,.6);background:rgba(255,90,90,.16);}",
  ".irg-tut-simple{background:linear-gradient(180deg,#ff9a3d,#ff7300);color:#fff;border-color:rgba(255,255,255,.4);",
  "box-shadow:0 8px 22px rgba(255,115,0,.35);}",
  ".irg-tut-simple:hover{box-shadow:0 12px 30px rgba(255,115,0,.5);}",
  "@keyframes irgWave{0%,60%,100%{transform:rotate(0)}10%{transform:rotate(16deg)}20%{transform:rotate(-8deg)}30%{transform:rotate(16deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(12deg)}}",
  "@keyframes irgGhostBob{0%,100%{transform:translateY(0) rotate(-2.5deg)}50%{transform:translateY(-5px) rotate(2.5deg)}}",
  "@keyframes irgGhostBlink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}",
  "@keyframes irgCaret{0%{opacity:1}50%{opacity:0}}",
  "@keyframes irgTutIn{from{opacity:0;transform:translateX(-50%) translateY(-10px) scale(.96)}",
  "to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}}",
  "@media (max-width:560px){.irg-tut{top:54px;}.irg-tut-text{font-size:13.5px;}.irg-tut-ghost{width:40px;height:44px;}.irg-tut-intro .irg-tut-ghost{width:66px;height:74px;}",
  ".irg-tut-intro{top:26%;}.irg-tut-intro .irg-tut-text{font-size:19px;}",
  ".irg-tut-btn{font-size:13px;padding:10px 16px;}.irg-tut-q{font-size:13.5px;}}",
  /* — Asso persistente (helper post-tutorial), ancorato a destra fuori dalla scena — */
  ".irg-helper{position:fixed;right:14px;top:50%;transform:translateY(-50%);z-index:60;cursor:pointer;",
  "display:flex;align-items:center;justify-content:flex-end;-webkit-tap-highlight-color:transparent;",
  "animation:irgHelperIn .5s cubic-bezier(.34,1.56,.64,1) both;}",
  ".irg-helper:focus-visible{outline:2px solid rgba(255,138,42,.85);outline-offset:4px;border-radius:12px;}",
  ".irg-helper-asso{width:58px;height:72px;display:block;pointer-events:none;",
  "filter:drop-shadow(0 6px 12px rgba(255,110,20,.42));animation:irgGhostBob 3.2s ease-in-out infinite;",
  "transition:transform .18s ease;}",
  ".irg-helper:hover .irg-helper-asso{transform:scale(1.07);}",
  ".irg-helper:active .irg-helper-asso{transform:scale(.94);}",
  ".irg-helper-asso svg{width:100%;height:100%;overflow:visible;display:block;}",
  ".irg-helper-talking .irg-helper-asso{animation-duration:1.6s;}",
  ".irg-helper-bubble{position:absolute;right:100%;margin-right:12px;bottom:50%;transform:translateY(50%);",
  "max-width:212px;width:max-content;text-align:left;color:#fdf3e8;font-size:13px;font-weight:600;line-height:1.4;",
  "background:linear-gradient(180deg,rgba(38,28,20,.97),rgba(26,19,13,.97));",
  "border:1px solid rgba(255,150,60,.45);border-radius:13px;padding:10px 13px;",
  "box-shadow:0 12px 30px rgba(0,0,0,.5),0 0 18px rgba(255,120,20,.14);",
  "animation:irgHelperBubbleIn .26s cubic-bezier(.34,1.56,.64,1) both;}",
  ".irg-helper-bubble::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);",
  "border:7px solid transparent;border-left-color:rgba(255,150,60,.55);}",
  "@keyframes irgHelperIn{from{opacity:0;transform:translateY(-50%) translateX(22px) scale(.8)}to{opacity:1;transform:translateY(-50%) translateX(0) scale(1)}}",
  "@keyframes irgHelperBubbleIn{from{opacity:0;transform:translateY(50%) translateX(8px) scale(.92)}to{opacity:1;transform:translateY(50%) translateX(0) scale(1)}}",
  "@media (max-width:560px){.irg-helper{right:8px;}.irg-helper-asso{width:48px;height:60px;}.irg-helper-bubble{max-width:160px;font-size:12px;}}",
  /* — punti caldi del tutorial: cerchio pulsante + cartello con freccia — */
  ".irg-spots{position:absolute;inset:0;z-index:50;pointer-events:none;}",
  ".irg-spot{position:absolute;animation:irgSpotPop .42s cubic-bezier(.34,1.45,.64,1) both;}",
  ".irg-spot-ring{position:absolute;inset:-6px;border:2.5px solid #ffcf45;border-radius:13px;",
  "box-shadow:0 0 0 3px rgba(255,207,69,.16),0 0 18px rgba(255,160,40,.5);",
  "animation:irgSpotPulse 1.5s ease-in-out infinite;}",
  /* il cartello usa transform per centrarsi sul lato: l'entrata è solo in
     opacità così non entra in conflitto col posizionamento */
  ".irg-spot-label{position:absolute;width:max-content;max-width:220px;text-align:center;",
  "background:linear-gradient(180deg,#ffd45a,#ff9d2e);color:#3a1f00;font-size:12px;font-weight:800;",
  "line-height:1.32;letter-spacing:.2px;padding:6px 11px;border-radius:10px;",
  "box-shadow:0 9px 24px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.4);",
  "opacity:0;animation:irgSpotLabel .4s ease .12s forwards;}",
  ".irg-spot-label:after{content:'';position:absolute;width:9px;height:9px;background:inherit;",
  "transform:rotate(45deg);}",
  /* lato cartello + freccia */
  ".irg-spot-bottom .irg-spot-label{top:calc(100% + 14px);left:50%;transform:translateX(-50%);}",
  ".irg-spot-bottom .irg-spot-label:after{top:-4px;left:50%;margin-left:-4px;}",
  ".irg-spot-top .irg-spot-label{bottom:calc(100% + 14px);left:50%;transform:translateX(-50%);}",
  ".irg-spot-top .irg-spot-label:after{bottom:-4px;left:50%;margin-left:-4px;}",
  ".irg-spot-left .irg-spot-label{right:calc(100% + 14px);top:50%;transform:translateY(-50%);}",
  ".irg-spot-left .irg-spot-label:after{right:-4px;top:50%;margin-top:-4px;}",
  ".irg-spot-right .irg-spot-label{left:calc(100% + 14px);top:50%;transform:translateY(-50%);}",
  ".irg-spot-right .irg-spot-label:after{left:-4px;top:50%;margin-top:-4px;}",
  "@keyframes irgSpotPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}",
  "@keyframes irgSpotLabel{to{opacity:1}}",
  "@keyframes irgSpotPulse{0%,100%{box-shadow:0 0 0 3px rgba(255,207,69,.14),0 0 14px rgba(255,160,40,.38);border-color:#ffc636}",
  "50%{box-shadow:0 0 0 7px rgba(255,207,69,.05),0 0 28px rgba(255,160,40,.7);border-color:#ffe289}}",
  /* zoom leggero sull'elemento cerchiato (classe applicata da TutorialHotspots) */
  ".irg-spot-target{position:relative;z-index:2;transform-origin:center center;transform:scale(1.05);",
  "transition:transform .42s cubic-bezier(.34,1.45,.64,1);transition-delay:var(--irg-spot-delay,0s);}",
  "@media (prefers-reduced-motion:reduce){.irg-spot-ring{animation:none}.irg-spot-target{transition:none;transform:scale(1.03)}}",
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
  ".irg-x{position:absolute;top:10px;right:10px;z-index:5;width:34px;height:34px;border:0;border-radius:10px;",
  "background:rgba(255,255,255,.08);color:#ffe9b0;font-size:16px;line-height:1;cursor:pointer;",
  "border:1px solid rgba(242,185,75,.35);",
  "transition:transform .15s ease,background .15s ease,border-color .15s ease,color .15s ease;}",
  ".irg-x:hover{background:rgba(255,115,0,.2);color:#fff;border-color:#FF7300;transform:rotate(8deg) scale(1.08);}",
  ".irg-esc{font-family:'Press Start 2P','Courier New',monospace;font-size:8px;opacity:.6;margin-left:8px;letter-spacing:.5px;}",
  ".irg-mtitle{font-family:'Press Start 2P','Courier New',monospace;font-size:13px;display:flex;align-items:center;gap:10px;}",
  /* — scrollbar — */
  ".irg-modal ::-webkit-scrollbar,.irg-modal::-webkit-scrollbar{width:9px;height:9px;}",
  ".irg-modal ::-webkit-scrollbar-thumb,.irg-modal::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(242,185,75,.5),rgba(242,185,75,.25));border-radius:8px;}",
  ".irg-modal ::-webkit-scrollbar-track,.irg-modal::-webkit-scrollbar-track{background:rgba(0,0,0,.2);}",
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
  /* — modale deck (pannello a tema blu/oro, cornice pixel) — */
  ".irg-m-decks{width:680px;max-width:100%;color:#eef2ff;padding:20px 18px;border-radius:18px;",
  "background:linear-gradient(180deg, rgba(20,28,58,.95) 0%, rgba(8,10,22,.98) 100%);",
  "border:2px solid rgba(242,185,75,.35);",
  "box-shadow:inset 0 1px 0 rgba(255,215,128,.2),inset 0 -1px 0 rgba(255,115,0,.08),",
  "0 24px 70px rgba(0,0,0,.7),0 0 0 1px rgba(255,115,0,.08);}",
  ".irg-tabs{display:flex;gap:8px;margin:16px 0 12px;flex-wrap:wrap;}",
  ".irg-tab{border:0;cursor:pointer;font-size:11.5px;font-weight:800;letter-spacing:.4px;",
  "color:rgba(255,255,255,.72);background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);",
  "padding:8px 16px;border-radius:999px;transition:all .15s ease;}",
  ".irg-tab:hover{background:rgba(255,255,255,.14);color:#fff;transform:translateY(-1px);}",
  ".irg-tab.irg-on{background:rgba(243,199,106,.16);color:#F3C76A;box-shadow:inset 0 0 0 1px rgba(243,199,106,.45);}",
  ".irg-panel{background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);",
  "border-radius:18px;padding:14px;min-height:300px;max-height:min(480px,58vh);overflow:auto;}",
  ".irg-m-decks-wide{width:min(1200px,96vw);max-width:96vw;}",
  ".irg-m-decks-wide .irg-panel{max-height:min(680px,70vh);}",
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
  ".irg-m-pc{width:min(1500px,96vw);max-width:96vw;height:calc(100% - 78px);max-height:calc(100% - 78px);align-self:flex-start;margin-top:48px;display:flex;flex-direction:column;border-radius:18px;padding:18px 18px 34px;",
  "background:linear-gradient(180deg, rgba(20,28,58,.95) 0%, rgba(8,10,22,.98) 100%);",
  "border:2px solid rgba(242,185,75,.35);",
  "box-shadow:inset 0 1px 0 rgba(255,215,128,.2),inset 0 -1px 0 rgba(255,115,0,.08),",
  "0 24px 70px rgba(0,0,0,.7),0 0 0 1px rgba(255,115,0,.08);}",
  ".irg-m-pc .irg-brand{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);",
  "font-family:'Press Start 2P',monospace;font-size:7px;color:#8c94a0;letter-spacing:2px;}",
  ".irg-m-pc .irg-led{position:absolute;bottom:9px;right:18px;width:7px;height:7px;border-radius:50%;",
  "background:#51e3a4;box-shadow:0 0 7px #51e3a4;animation:irgLed 2.4s ease-in-out infinite;}",
  "@keyframes irgLed{0%,100%{opacity:1}50%{opacity:.45}}",
  ".irg-screen{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;border-radius:12px;border:2px solid rgba(242,185,75,.45);overflow:hidden;",
  "background:linear-gradient(180deg,#3a5fbe 0%,#1a2a52 100%);",
  "box-shadow:inset 0 0 44px rgba(15,20,55,.7),inset 0 1px 0 rgba(255,215,128,.25);}",
  ".irg-screen:after{content:'';position:absolute;inset:0;pointer-events:none;border-radius:10px;z-index:50;",
  "background:repeating-linear-gradient(0deg,rgba(255,255,255,.028) 0 1px,transparent 1px 3px);",
  "animation:irgCrt 9s linear infinite;}",
  "@keyframes irgCrt{0%,100%{opacity:.85}50%{opacity:1}}",
  ".irg-pcwrap{padding:22px 20px 18px;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;}",
  ".irg-ebx-h1{font-family:'Press Start 2P','Courier New',monospace;font-size:18px;font-weight:400;",
  "text-transform:uppercase;letter-spacing:1.5px;color:#F3C76A;",
  "text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 12px rgba(255,115,0,.25);",
  "display:flex;align-items:center;gap:10px;}",
  ".irg-ebx-h1 b{color:#FF7300;text-shadow:0 0 14px rgba(255,115,0,.55);}",
  ".irg-ebx-sub{margin-top:8px;font-size:12px;color:rgba(255,255,255,.7);letter-spacing:.3px;",
  "display:flex;align-items:center;flex-wrap:wrap;gap:6px;}",
  ".irg-ebx-sub b{color:#F3C76A;font-weight:700;}",
  ".irg-glass{margin-top:16px;display:flex;flex-direction:column;flex:1 1 auto;min-height:0;",
  "background:linear-gradient(180deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.03) 100%);",
  "border:1px solid rgba(242,185,75,.28);",
  "border-radius:16px;",
  "box-shadow:inset 0 0 0 1px rgba(255,215,128,.08),inset 0 1px 0 rgba(255,255,255,.06),0 16px 40px -16px rgba(0,0,0,.6);}",
  ".irg-tablewrap{flex:1 1 auto;min-height:0;max-height:none;overflow:auto;border-radius:14px;",
  "scrollbar-color:rgba(242,185,75,.4) transparent;}",
  ".irg-ebx-table{width:100%;min-width:620px;border-collapse:separate;border-spacing:0;text-align:left;color:#fff;font-size:13px;}",
  ".irg-ebx-table thead th{position:sticky;top:0;z-index:2;",
  "background:linear-gradient(180deg,rgba(242,185,75,.18) 0%,rgba(242,185,75,.08) 100%);",
  "font-family:'Press Start 2P','Courier New',monospace;font-size:9px;font-weight:400;",
  "text-transform:uppercase;letter-spacing:1.5px;color:#F3C76A;",
  "padding:14px 16px;border-bottom:1.5px solid rgba(242,185,75,.35);",
  "text-shadow:0 1px 2px rgba(0,0,0,.5);}",
  ".irg-ebx-table thead th:first-child{border-top-left-radius:14px;}",
  ".irg-ebx-table thead th:last-child{border-top-right-radius:14px;}",
  ".irg-ebx-table td{padding:14px 16px;border-bottom:1px solid rgba(242,185,75,.12);vertical-align:middle;}",
  ".irg-ebx-table tbody tr{transition:background .15s;}",
  ".irg-ebx-table tbody tr:hover{background:rgba(255,115,0,.08);}",
  ".irg-ebx-table tbody tr:last-child td{border-bottom:0;}",
  ".irg-buyin{color:#F3C76A;font-weight:700;text-transform:uppercase;letter-spacing:.6px;font-size:12.5px;}",
  ".irg-forma{font-size:17px;font-weight:700;color:#fff;}",
  ".irg-regnum{font-size:17px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;}",
  ".irg-sb{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;",
  "font-family:'Press Start 2P','Courier New',monospace;font-size:9px;font-weight:400;letter-spacing:.5px;",
  "white-space:nowrap;text-transform:uppercase;}",
  ".irg-sb.reg{background:linear-gradient(135deg,rgba(242,185,75,.2),rgba(242,185,75,.08));color:#F3C76A;",
  "box-shadow:inset 0 0 0 1px rgba(242,185,75,.4),0 0 8px rgba(242,185,75,.15);}",
  ".irg-sb.live{background:linear-gradient(135deg,rgba(239,68,68,.22),rgba(239,68,68,.08));color:#fca5a5;",
  "box-shadow:inset 0 0 0 1px rgba(248,113,113,.45),0 0 10px rgba(239,68,68,.2);}",
  ".irg-sb.end{background:rgba(255,255,255,.06);color:rgba(255,255,255,.55);",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);}",
  ".irg-dot{width:6px;height:6px;border-radius:50%;background:currentColor;",
  "box-shadow:0 0 8px currentColor;animation:irgPulseDot 1.6s ease-in-out infinite;}",
  ".irg-pulse{animation:irgPulseDot 1.6s ease-in-out infinite;}",
  "@keyframes irgPulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}",
  ".irg-tip{position:relative;display:inline-flex;align-items:center;}",
  ".irg-tip>.irg-pop{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);",
  "display:none;z-index:40;flex-direction:column;align-items:center;}",
  ".irg-tip:hover>.irg-pop{display:flex;animation:irgPopIn .16s ease;}",
  "@keyframes irgPopIn{from{opacity:0;transform:translateX(-50%) translateY(-4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}",
  ".irg-poparrow{width:8px;height:8px;background:rgba(8,10,22,.98);border-left:1px solid rgba(242,185,75,.4);",
  "border-top:1px solid rgba(242,185,75,.4);transform:rotate(45deg);margin-bottom:-4px;}",
  ".irg-popcard{background:linear-gradient(180deg,rgba(20,28,58,.98) 0%,rgba(8,10,22,.98) 100%);",
  "border:1px solid rgba(242,185,75,.35);border-radius:14px;",
  "box-shadow:0 18px 40px rgba(0,0,0,.6),0 0 0 1px rgba(255,115,0,.1);",
  "padding:10px;width:190px;text-align:left;font-size:11px;color:#fff;}",
  ".irg-popmini{width:auto;padding:5px 10px;border-radius:9px;font-size:10px;font-weight:700;white-space:nowrap;}",
  ".irg-eye{color:rgba(255,255,255,.7);cursor:pointer;display:inline-flex;transition:color .15s;}",
  ".irg-tip:hover .irg-eye{color:#FF7300;}",
  ".irg-eyebtn{background:none;border:0;padding:0;margin:0;cursor:pointer;display:inline-flex;line-height:0;}",
  ".irg-eyebtn:hover .irg-eye{color:#FF7300;}",
  ".irg-plist{display:flex;flex-wrap:wrap;gap:7px;align-items:center;list-style:none;margin:0;padding:0;}",
  ".irg-ppill{position:relative;display:inline-flex;align-items:center;border-radius:999px;",
  "background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 1px rgba(242,185,75,.3);",
  "padding:3px 10px;font-size:11px;font-weight:600;color:#fff;cursor:help;",
  "transition:background .15s,border-color .15s;}",
  ".irg-ppill:hover{background:rgba(255,115,0,.15);}",
  ".irg-pchead{display:flex;justify-content:space-between;align-items:center;gap:6px;",
  "border-bottom:1px solid rgba(242,185,75,.2);padding-bottom:5px;margin-bottom:5px;font-weight:800;font-size:11px;}",
  ".irg-flagchip{display:inline-flex;align-items:center;gap:4px;background:rgba(242,185,75,.15);",
  "padding:2px 6px;border-radius:6px;font-size:10px;font-weight:800;color:#F3C76A;",
  "box-shadow:inset 0 0 0 1px rgba(242,185,75,.3);}",
  ".irg-pcrow{display:flex;justify-content:space-between;color:rgba(255,255,255,.7);font-size:10px;margin-top:3px;}",
  ".irg-pcrow b{color:#fff;}",
  ".irg-pcrow .irg-on{color:#34d399;}",
  ".irg-pclab{display:block;margin-top:7px;padding-top:5px;border-top:1px solid rgba(242,185,75,.15);",
  "font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);}",
  ".irg-pcdeck{display:block;margin-top:2px;font-size:11.5px;font-weight:800;color:#F3C76A;}",
  ".irg-ebx-join{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 14px;",
  "font-family:'Press Start 2P','Courier New',monospace;font-size:9px;letter-spacing:.5px;",
  "color:#fff;cursor:pointer;text-transform:uppercase;",
  "background:linear-gradient(135deg,rgba(255,115,0,.5),rgba(255,115,0,.18));",
  "border:1.5px solid rgba(255,115,0,.65);",
  "box-shadow:inset 0 1px 1.5px rgba(255,255,255,.4),0 4px 12px rgba(0,0,0,.3),0 0 12px rgba(255,115,0,.3);",
  "transition:all .15s ease;}",
  ".irg-ebx-join:hover{background:linear-gradient(135deg,rgba(255,115,0,.6),rgba(255,115,0,.28));",
  "box-shadow:inset 0 1px 2px rgba(255,255,255,.5),0 8px 20px rgba(0,0,0,.4),0 0 22px rgba(255,115,0,.6);",
  "transform:translateY(-2px) scale(1.02);}",
  ".irg-ebx-join:active{transform:translateY(0) scale(.98);}",
  ".irg-ebx-empty{padding:48px 20px;text-align:center;}",
  ".irg-ebx-empty p{margin:0;font-family:'Press Start 2P','Courier New',monospace;font-size:13px;",
  "text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,.75);}",
  ".irg-ebx-empty span{display:block;margin-top:10px;font-size:12px;color:rgba(255,255,255,.5);}",
  ".irg-mut{color:rgba(255,255,255,.3);}",
  /* — responsive — */
  "@media (max-width:900px){",
  ".irg-m-decks-wide{width:100%;max-width:100%;}",
  "}",
  "@media (max-width:600px){",
  ".irg-grid2{grid-template-columns:1fr;}",
  ".irg-m-decks{padding:12px;}",
  ".irg-m-decks-wide .irg-panel{max-height:min(520px,62vh);}",
  ".irg-hide-sm{display:none;}",
  ".irg-ebx-table{font-size:12px;}",
  ".irg-mtitle{font-size:11px;}",
  "}",
  /* — Tornei Live: 7 card formati orizzontali con video all'hover — */
  ".irg-fmts{display:grid;grid-template-columns:repeat(8,1fr);gap:10px;margin:16px 0 4px;}",
  ".irg-fmtcard{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;cursor:pointer;",
  "background:rgba(0,0,0,.35);box-shadow:inset 0 0 0 1px rgba(255,255,255,.12),0 8px 18px rgba(0,0,0,.4);",
  "transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s ease;will-change:transform;}",
  ".irg-fmtcard:hover{transform:scale(1.3);z-index:10;",
  "box-shadow:inset 0 0 0 1px rgba(255,115,0,.55),0 16px 34px rgba(0,0,0,.55),0 0 22px rgba(255,115,0,.35);}",
  ".irg-fmtimg,.irg-fmtvid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}",
  ".irg-fmtvid{opacity:0;transition:opacity .25s ease;}",
  ".irg-fmtcard:hover .irg-fmtvid{opacity:1;}",
  ".irg-fmtlabel{position:absolute;left:0;right:0;bottom:0;z-index:2;padding:16px 8px 6px;",
  "font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#fff;text-align:center;",
  "text-shadow:0 1px 4px rgba(0,0,0,.85);background:linear-gradient(to top,rgba(0,0,0,.78),transparent);}",
  /* — modalità leggera — */
  ".irg-quality-low .irg-backdrop,.irg-quality-low .irg-m-decks,.irg-quality-low .irg-m-pc{",
  "backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(10,12,22,.94);}",
  ".irg-quality-low .irg-screen:after{display:none;}",
  ".irg-quality-low .irg-led{animation:none;}",
  ".irg-quality-low .irg-dot,.irg-quality-low .irg-pulse{animation:none;}",
  ".irg-quality-low .irg-card.irg-r-leggendaria .irg-cardart:after{display:none;}",
  ".irg-quality-low .irg-fmtcard video{display:none;}",
  /* — Select stilizzato (coerente col minigioco) — */
  ".irg-select{position:relative;width:100%;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;}",
  ".irg-select-trigger{width:100%;display:flex;align-items:center;gap:8px;",
  "padding:9px 12px;border-radius:10px;",
  "background:rgba(10,12,22,.72);border:1px solid rgba(255,255,255,.18);",
  "color:#fff;font-size:13px;font-weight:600;text-align:left;cursor:pointer;",
  "transition:border-color .15s,background .15s,box-shadow .15s;",
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 2px 6px rgba(0,0,0,.25);}",
  ".irg-select-trigger:hover{border-color:rgba(255,115,0,.55);background:rgba(10,12,22,.86);}",
  ".irg-select-open .irg-select-trigger{border-color:#FF7300;",
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 0 2px rgba(255,115,0,.25),0 4px 12px rgba(0,0,0,.35);}",
  ".irg-select-trigger:disabled{opacity:.5;cursor:not-allowed;}",
  ".irg-select-value{display:flex;align-items:center;gap:8px;flex:1;min-width:0;}",
  ".irg-select-swatch{width:10px;height:10px;border-radius:3px;flex:0 0 auto;",
  "box-shadow:inset 0 0 0 1px rgba(255,255,255,.35),0 0 6px currentColor;}",
  ".irg-select-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
  ".irg-select-placeholder{color:rgba(255,255,255,.45);font-style:italic;}",
  ".irg-select-arrow{color:#FF7300;font-size:11px;line-height:1;",
  "transition:transform .18s ease;text-shadow:0 0 6px rgba(255,115,0,.6);}",
  ".irg-select-arrow-up{transform:rotate(180deg);}",
  ".irg-select-menu{position:fixed;z-index:9999;margin:0;padding:6px;list-style:none;",
  "background:linear-gradient(180deg,#1a1f3a 0%,#0d111c 100%);",
  "border:1px solid rgba(255,255,255,.18);border-radius:12px;",
  "box-shadow:0 12px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.08);",
  "overflow-y:auto;",
  "animation:irgSelectIn .14s ease;}",
  "@keyframes irgSelectIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}",
  ".irg-select-menu::-webkit-scrollbar{width:8px;}",
  ".irg-select-menu::-webkit-scrollbar-thumb{background:rgba(255,255,255,.18);border-radius:6px;}",
  ".irg-select-option{display:flex;align-items:center;gap:9px;",
  "padding:8px 10px;border-radius:8px;cursor:pointer;color:rgba(255,255,255,.85);",
  "font-size:13px;font-weight:600;",
  "transition:background .12s,color .12s;outline:none;}",
  ".irg-select-option:hover,.irg-select-option:focus{",
  "background:rgba(255,115,0,.16);color:#fff;}",
  ".irg-select-option-active{background:rgba(255,115,0,.22);color:#fff;}",
  ".irg-select-option-active::before{content:'';position:absolute;left:0;width:3px;height:60%;",
  "top:20%;background:#FF7300;border-radius:0 2px 2px 0;}",
  ".irg-select-option{position:relative;}",
  ".irg-select-option-text{display:flex;flex-direction:column;flex:1;min-width:0;}",
  ".irg-select-option-label{font-weight:700;}",
  ".irg-select-option-hint{font-size:10.5px;font-weight:500;color:rgba(255,255,255,.5);",
  "letter-spacing:.2px;margin-top:1px;}",
  ".irg-select-check{color:#FF7300;font-size:12px;font-weight:900;",
  "text-shadow:0 0 8px rgba(255,115,0,.7);}",
  /* adatta lo stile anche dentro la modale deck */
  ".irg-m-decks .irg-select-trigger{background:rgba(255,255,255,.07);",
  "border:1px solid rgba(255,255,255,.15);}",
  ".irg-m-decks .irg-select-trigger:hover{background:rgba(255,255,255,.1);}",
  /* adatta lo stile dentro la modale bacheca (carta / sughero) */
  ".irg-m-board .irg-select-trigger{background:rgba(253,248,236,.8);",
  "border:1.5px dashed #cdb088;color:#3c2a18;",
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}",
  ".irg-m-board .irg-select-trigger:hover{background:#fdf8ec;border-color:#d94f46;}",
  ".irg-m-board .irg-select-open .irg-select-trigger{border-style:solid;border-color:#d94f46;",
  "box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 0 0 2px rgba(217,79,70,.18);}",
  ".irg-m-board .irg-select-label{color:#3c2a18;}",
  ".irg-m-board .irg-select-arrow{color:#d94f46;text-shadow:none;}",
  ".irg-m-board .irg-select-menu{background:linear-gradient(180deg,#fdf8ec 0%,#f5ecd5 100%);",
  "border:1.5px solid #cdb088;",
  "box-shadow:0 12px 30px rgba(60,35,10,.45),inset 0 1px 0 rgba(255,255,255,.5);}",
  ".irg-m-board .irg-select-option{color:#3c2a18;}",
  ".irg-m-board .irg-select-option:hover,.irg-m-board .irg-select-option:focus{",
  "background:rgba(217,79,70,.12);color:#3c2a18;}",
  ".irg-m-board .irg-select-option-active{background:rgba(217,79,70,.18);color:#3c2a18;}",
  ".irg-m-board .irg-select-option-active::before{background:#d94f46;}",
  ".irg-m-board .irg-select-check{color:#d94f46;text-shadow:none;}",
  ".irg-m-board .irg-select-option-hint{color:rgba(60,42,24,.55);}",
  /* — modale specchio: personalizzazione avatar — */
  ".irg-m-mirror{width:560px;max-width:100%;background:linear-gradient(180deg,#1b1f36,#12152400);",
  "background-color:#161a2e;border:1px solid rgba(129,140,248,.32);padding:20px;color:#eef2ff;}",
  ".irg-m-mirror .irg-mtitle{color:#dfe5ff;}",
  ".irg-mirror{display:flex;gap:18px;margin-top:14px;align-items:stretch;}",
  "@media (max-width:520px){.irg-mirror{flex-direction:column;}}",
  ".irg-mirror-preview{flex:0 0 150px;display:flex;align-items:center;justify-content:center;",
  "border-radius:14px;padding:10px;background:linear-gradient(180deg,#dceaf4,#9fc0d8 55%,#7aa0bf);",
  "box-shadow:inset 0 2px 10px rgba(255,255,255,.4),inset 0 -10px 26px rgba(40,60,90,.35),0 10px 26px rgba(0,0,0,.4);",
  "border:5px solid #6e5236;position:relative;overflow:hidden;}",
  ".irg-mirror-preview:after{content:'';position:absolute;top:0;left:14%;width:18%;height:100%;",
  "background:linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,0));transform:skewX(-8deg);pointer-events:none;}",
  ".irg-mirror-cv{image-rendering:pixelated;position:relative;z-index:1;}",
  ".irg-mirror-opts{flex:1 1 auto;display:flex;flex-direction:column;gap:14px;min-width:0;}",
  ".irg-mirror-group h4{margin:0 0 8px;font-size:12px;font-weight:800;letter-spacing:.6px;",
  "text-transform:uppercase;color:#aab4e6;}",
  ".irg-mirror-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}",
  ".irg-look-btn{display:flex;align-items:center;gap:7px;cursor:pointer;border-radius:11px;padding:9px 10px;",
  "font-size:12.5px;font-weight:700;color:#dfe5ff;font-family:'Segoe UI',system-ui,sans-serif;",
  "border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);",
  "transition:background-color .15s,border-color .15s,transform .1s;text-align:left;}",
  ".irg-look-btn:hover{background:rgba(129,140,248,.16);border-color:rgba(129,140,248,.5);transform:translateY(-1px);}",
  ".irg-look-btn.on{background:linear-gradient(180deg,rgba(255,154,61,.25),rgba(255,115,0,.18));",
  "border-color:#ff9a3d;box-shadow:0 0 0 1px rgba(255,154,61,.4);color:#fff;}",
  ".irg-look-ico{font-size:14px;line-height:1;}",
  ".irg-look-sw{flex:0 0 auto;width:13px;height:13px;border-radius:4px;border:1px solid rgba(255,255,255,.45);",
  "box-shadow:inset 0 1px 1px rgba(255,255,255,.4);}",
  ".irg-look-sex{margin-left:auto;font-size:10px;opacity:.6;}",
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

/* — Punti caldi del tutorial: cerchio pulsante + cartello (con freccia) sui
   pochi elementi che contano davvero dentro la modale aperta. Sovrapposizione
   non interattiva (pointer-events:none) ancorata al riquadro del gioco; le
   posizioni si ri-misurano a intervalli per seguire scroll/resize/layout. */
/* Typewriter del banner tutorial: evidenzia il brand arancione Ebartex. */
function tutBrandRange(text) {
  const chars = Array.from(text || "");
  const needle = Array.from(TUT_BRAND);
  if (!needle.length) return [-1, -1];
  outer: for (let i = 0; i <= chars.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (chars[i + j] !== needle[j]) continue outer;
    }
    return [i, i + needle.length];
  }
  return [-1, -1];
}
function tutStepPillRange(text) {
  const chars = Array.from(text || "");
  const m = (text || "").match(/[1-3] di 3/);
  if (!m) return [-1, -1];
  const pill = Array.from(m[0]);
  outer: for (let i = 0; i <= chars.length - pill.length; i++) {
    for (let j = 0; j < pill.length; j++) {
      if (chars[i + j] !== pill[j]) continue outer;
    }
    return [i, i + pill.length];
  }
  return [-1, -1];
}
function renderTutReserve(full) {
  const [pillStart, pillEnd] = tutStepPillRange(full);
  const chars = Array.from(full);
  if (pillStart < 0) return full;
  return (
    <>
      {chars.slice(0, pillStart).join("")}
      <span className="irg-tut-pill">{chars.slice(pillStart, pillEnd).join("")}</span>
      {chars.slice(pillEnd).join("")}
    </>
  );
}
function renderTutTyped(typed, full) {
  const [brandStart, brandEnd] = tutBrandRange(full);
  const [pillStart, pillEnd] = tutStepPillRange(full);
  const typedChars = Array.from(typed);
  const chCls = (idx) => {
    const brand = brandStart >= 0 && idx >= brandStart && idx < brandEnd;
    return "irg-tut-ch" + (brand ? " irg-tut-brand" : "");
  };

  const nodes = [];
  let i = 0;
  while (i < typedChars.length) {
    if (pillStart >= 0 && i >= pillStart && i < pillEnd) {
      const pillChars = [];
      while (i < typedChars.length && i < pillEnd) {
        pillChars.push({ ch: typedChars[i], idx: i });
        i += 1;
      }
      nodes.push(
        <span key={"pill" + pillStart} className="irg-tut-pill">
          {pillChars.map(({ ch, idx }) => (
            <span key={idx} className={chCls(idx)}>{ch}</span>
          ))}
        </span>
      );
      continue;
    }
    const ch = typedChars[i];
    if (ch === "\n") {
      nodes.push(<br key={"br" + i} />);
      i += 1;
      continue;
    }
    if (/^\s$/.test(ch)) {
      nodes.push(<span key={"s" + i} className={"irg-tut-sp " + chCls(i)}>{ch}</span>);
      i += 1;
      continue;
    }
    const start = i;
    let word = "";
    while (i < typedChars.length && typedChars[i] !== "\n" && !/^\s$/.test(typedChars[i])) {
      if (pillStart >= 0 && i >= pillStart && i < pillEnd) break;
      word += typedChars[i];
      i += 1;
    }
    if (!word) continue;
    nodes.push(
      <span key={"w" + start} className="irg-tut-word">
        {Array.from(word).map((wc, j) => (
          <span key={j} className={chCls(start + j)}>{wc}</span>
        ))}
      </span>
    );
  }
  return nodes;
}

function TutorialHotspots({ wrapRef, modalId, uiId }) {
  const [spots, setSpots] = useState([]);
  const taggedRef = useRef(new Set());

  const clearTargets = () => {
    for (const el of taggedRef.current) {
      el.classList.remove("irg-spot-target");
      el.style.removeProperty("--irg-spot-delay");
    }
    taggedRef.current.clear();
  };

  const syncTargets = (entries) => {
    const next = new Set(entries.map((e) => e.el));
    for (const el of taggedRef.current) {
      if (!next.has(el)) {
        el.classList.remove("irg-spot-target");
        el.style.removeProperty("--irg-spot-delay");
        taggedRef.current.delete(el);
      }
    }
    for (const { el, delay } of entries) {
      if (!taggedRef.current.has(el)) {
        el.style.setProperty("--irg-spot-delay", delay + "s");
        el.classList.add("irg-spot-target");
        taggedRef.current.add(el);
      }
    }
  };

  useEffect(() => {
    const spotId = uiId || modalId;
    if (!spotId) { clearTargets(); setSpots([]); return; }
    const specs = uiId ? TUT_UI_HOTSPOTS[uiId] : TUT_HOTSPOTS[modalId];
    if (!specs || !specs.length) { clearTargets(); setSpots([]); return; }

    let alive = true, raf = null, prev = "";
    const resolve = (spec, root) => {
      if (spec.sel) return root.querySelector(spec.sel);
      if (spec.text) {
        const needle = spec.text.toLowerCase();
        const els = root.querySelectorAll("button, a, [role='button']");
        for (const el of els) {
          if ((el.textContent || "").toLowerCase().includes(needle)) return el;
        }
      }
      return null;
    };
    const measure = () => {
      if (!alive) return;
      const wrap = wrapRef.current;
      const root = wrap && (uiId ? wrap : wrap.querySelector(`[data-irg-modal="${modalId}"]`));
      if (wrap && root) {
        const wr = wrap.getBoundingClientRect();
        const clip = uiId ? wr : root.getBoundingClientRect();
        const next = [];
        const targets = [];
        specs.forEach((spec, i) => {
          const el = resolve(spec, root);
          if (!el) return;
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          if (r.bottom < clip.top + 4 || r.top > clip.bottom - 4) return;
          const delay = i * 0.95;
          targets.push({ el, delay });
          next.push({
            key: i, label: spec.label, side: spec.side || "bottom", delay,
            x: Math.round(r.left - wr.left), y: Math.round(r.top - wr.top),
            w: Math.round(r.width), h: Math.round(r.height),
          });
        });
        syncTargets(targets);
        const sig = JSON.stringify(next);
        if (sig !== prev) { prev = sig; setSpots(next); }
      } else if (prev !== "[]") {
        prev = "[]"; setSpots([]); clearTargets();
      }
      raf = setTimeout(measure, 160); // ri-misura morbida, costo trascurabile
    };
    measure();
    return () => { alive = false; if (raf) clearTimeout(raf); clearTargets(); };
  }, [wrapRef, modalId, uiId]);

  if (!spots.length) return null;
  return (
    <div className="irg-spots" aria-hidden>
      {spots.map((s) => (
        <div
          key={s.key}
          className={"irg-spot irg-spot-" + s.side}
          style={{ left: s.x, top: s.y, width: s.w, height: s.h, animationDelay: s.delay + "s" }}
        >
          <span className="irg-spot-ring" />
          <span className="irg-spot-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/* — Specchio: opzioni di personalizzazione (le chiavi combaciano con HAIR_STYLES/OUTFITS) — */
const MIRROR_HAIRS = [
  { id: "m1", label: "Corto", ico: "💇‍♂️", sex: "♂" },
  { id: "m2", label: "Rasato", ico: "👨‍🦲", sex: "♂" },
  { id: "m3", label: "Ricci", ico: "🧑‍🦱", sex: "♂" },
  { id: "f1", label: "Caschetto", ico: "👩", sex: "♀" },
  { id: "f2", label: "Coda", ico: "👱‍♀️", sex: "♀" },
  { id: "f3", label: "Lunghi", ico: "👩‍🦰", sex: "♀" },
];
const MIRROR_OUTFITS = [
  { id: "tank", label: "Canotta", col: "#16171e" },
  { id: "hoodie", label: "Felpa", col: "#ff7a2f" },
  { id: "jacket", label: "Bomber", col: "#3a4660" },
  { id: "shirt", label: "Camicia", col: "#dfe7f2" },
  { id: "jersey", label: "Maglia", col: "#2f9e6b" },
];

function MirrorModal({ look, onChange, drawPreview }) {
  const cref = useRef(null);
  useEffect(() => {
    if (cref.current && drawPreview) drawPreview(cref.current, look);
  }, [look, drawPreview]);
  return (
    <>
      <div className="irg-mtitle">🪞 Specchio <span className="irg-esc">ESC per chiudere</span></div>
      <div className="irg-mirror">
        <div className="irg-mirror-preview">
          <canvas ref={cref} width={132} height={232} className="irg-mirror-cv" />
        </div>
        <div className="irg-mirror-opts">
          <div className="irg-mirror-group">
            <h4>Capelli</h4>
            <div className="irg-mirror-grid">
              {MIRROR_HAIRS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  className={"irg-look-btn" + (look.hair === h.id ? " on" : "")}
                  onClick={() => onChange({ hair: h.id })}
                >
                  <span className="irg-look-ico" aria-hidden>{h.ico}</span>
                  {h.label}
                  <span className="irg-look-sex" aria-hidden>{h.sex}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="irg-mirror-group">
            <h4>Outfit</h4>
            <div className="irg-mirror-grid">
              {MIRROR_OUTFITS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  className={"irg-look-btn" + (look.outfit === o.id ? " on" : "")}
                  onClick={() => onChange({ outfit: o.id })}
                >
                  <span className="irg-look-sw" style={{ background: o.col }} aria-hidden />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* — 1. Bacheca: crea torneo — */
const BOARD_GIOCHI = ["Modern", "Standard", "Commander", "Legacy", "Pioneer", "Premodern", "Old School"];
const TIPI_TORNEO = ["Eliminazione diretta", "Doppia eliminazione", "Gironi"];
const BOARD_FORMAT_META = {
  "Modern": { color: "#06b6d4", hint: "da 2003 a oggi" },
  "Standard": { color: "#9aa3ad", hint: "rotazione biennale" },
  "Commander": { color: "#22c55e", hint: "100 carte · multiplayer" },
  "Legacy": { color: "#a855f7", hint: "tutte le carte" },
  "Pioneer": { color: "#3b82f6", hint: "da 2012 a oggi" },
  "Premodern": { color: "#7a5a2e", hint: "1995–2003" },
  "Old School": { color: "#a86b32", hint: "1993–1997 · carte originali" },
};
const BOARD_TIPO_META = {
  "Eliminazione diretta": { color: "#d94f46", hint: "single elimination" },
  "Doppia eliminazione": { color: "#f2b94b", hint: "loser bracket" },
  "Gironi": { color: "#4a7fd6", hint: "round robin" },
};
const BOARD_MAX_META = {
  2: { color: "#3b82f6", hint: "Heads-Up" },
  4: { color: "#22c55e", hint: "piccolo" },
  8: { color: "#f2b94b", hint: "medio" },
  16: { color: "#a855f7", hint: "grande" },
};
const BOARD_GIOCHI_OPTIONS = BOARD_GIOCHI.map((g) => ({
  value: g,
  label: g,
  color: BOARD_FORMAT_META[g]?.color,
  hint: BOARD_FORMAT_META[g]?.hint,
}));
const TIPI_TORNEO_OPTIONS = TIPI_TORNEO.map((t) => ({
  value: t,
  label: t,
  color: BOARD_TIPO_META[t]?.color,
  hint: BOARD_TIPO_META[t]?.hint,
}));
const MAX_OPTIONS = [2, 4, 8, 16].map((n) => ({
  value: String(n),
  label: String(n),
  color: BOARD_MAX_META[n]?.color,
  hint: BOARD_MAX_META[n]?.hint,
}));
const defaultDateIso = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const itDate = (iso) => (iso && iso.includes("-") ? iso.split("-").reverse().join("/") : iso);

function BoardModal({ onPublish, onClose, playSfx }) {
  const [form, setForm] = useState({
    nome: "", gioco: BOARD_GIOCHI[0], tipo: TIPI_TORNEO[0], max: "2", data: defaultDateIso(), premio: "",
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
            <StyledSelect
              value={form.gioco}
              onChange={(v) => setForm((f) => ({ ...f, gioco: v }))}
              options={BOARD_GIOCHI_OPTIONS}
              placeholder="Scegli formato…"
            />
          </div>
        </div>
        <div className="irg-paper irg-tilt-r">
          <div className="irg-grid2">
            <div className="irg-field">
              <label htmlFor="irg-tipo">Tipo torneo</label>
              <StyledSelect
                value={form.tipo}
                onChange={(v) => setForm((f) => ({ ...f, tipo: v }))}
                options={TIPI_TORNEO_OPTIONS}
                placeholder="Scegli tipo…"
              />
            </div>
            <div className="irg-field">
              <label htmlFor="irg-max">Max partecipanti</label>
              <StyledSelect
                value={form.max}
                onChange={(v) => setForm((f) => ({ ...f, max: v }))}
                options={MAX_OPTIONS}
                placeholder="Scegli max…"
              />
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

/* — Tornei Live: 8 formati orizzontali (immagine + video all'hover) — */
const FORMATS_OR = [
  { key: "old-school", label: "Old School", img: "/immagini-formato-orizzontale/old-school-or.webp", vid: "/video-animazione-orizzontale/animazione-old-school.webm" },
  { key: "pre-modern", label: "Pre-Modern", img: "/immagini-formato-orizzontale/pre-modern-or.webp", vid: "/video-animazione-orizzontale/animazione-pre-modern.webm" },
  { key: "pioneer", label: "Pioneer", img: "/immagini-formato-orizzontale/pioneer-or.webp", vid: "/video-animazione-orizzontale/animazione-piooner.webm" },
  { key: "modern", label: "Modern", img: "/immagini-formato-orizzontale/modern-or.webp", vid: "/video-animazione-orizzontale/animazione-modern.webm" },
  { key: "standard", label: "Standard", img: "/immagini-formato-orizzontale/standard-or.webp", vid: "/video-animazione-orizzontale/animazione-standard.webm" },
  { key: "legacy", label: "Legacy", img: "/immagini-formato-orizzontale/legacy-or.webp", vid: "/video-animazione-orizzontale/animazione-legacy.webm" },
  { key: "pauper", label: "Pauper", img: "/immagini-formato-orizzontale/pauper-or.webp", vid: "/video-animazione-orizzontale/animazione-pauper.webm" },
  { key: "commander", label: "Commander", img: "/immagini-formato-orizzontale/commander-or.webp", vid: "/video-animazione-orizzontale/animazione-commander.webm" },
];

function FormatCard({ fmt }) {
  const vref = React.useRef(null);
  const onEnter = () => {
    const v = vref.current;
    if (!v) return;
    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* play interrotto */ }
  };
  const onLeave = () => {
    const v = vref.current;
    if (!v) return;
    try { v.pause(); v.currentTime = 0; } catch (e) { /* noop */ }
  };
  return (
    <div className="irg-fmtcard" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <img className="irg-fmtimg" src={fmt.img} alt={fmt.label} loading="lazy" draggable="false" />
      <video ref={vref} className="irg-fmtvid" src={fmt.vid} muted loop playsInline preload="none" />
      <span className="irg-fmtlabel">{fmt.label}</span>
    </div>
  );
}

function PcModal({ tournaments, onJoin, onObserve, me, formatName, modeName }) {
  return (
    <>
      <div className="irg-screen">
        <div className="irg-pcwrap">
          <div className="irg-ebx-h1">Tornei <b>Live</b></div>
          <div className="irg-ebx-sub">
            {formatName && <>{formatName} · </>}
            {modeName} · Buy-In <b>For Fun</b> <span className="irg-esc">ESC per chiudere</span>
          </div>
          <div className="irg-fmts">
            {FORMATS_OR.map((f) => (
              <FormatCard key={f.key} fmt={f} />
            ))}
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
                                <button
                                  type="button"
                                  className="irg-tip irg-eyebtn"
                                  onClick={() => onObserve && onObserve(t.id)}
                                  aria-label="Osserva partita live"
                                >
                                  <span className="irg-eye"><IcoEye /></span>
                                  <MiniTip text="Osserva partita live" />
                                </button>
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

/* Griglia pixel di Asso, condivisa tra lo sprite SVG e il disegno su canvas
   del compagno-guida dentro il minigioco. */
const ASSO_GW = 18, ASSO_GH = 22;
const ASSO_GRID = [
  "........y.........",
  "..b............g..",
  "....DDDDDDDDDD....",
  "...DllllllllllD...",
  "...DloooooooolD...",
  "...DOCCCCCCCCOD...",
  "...DOCCCCCCCCOD...",
  "...DOCCCCCCCCOD...",
  "...DOCWECCWECOD...",
  "...DOCEECCEECOD...",
  "...DOBCCCCCCBOD...",
  "...DOCCMCCMCCOD...",
  "...DOCCCMMCCCOD...",
  "...DOCCCCCCCCOD...",
  "...DOOOOOOOOOOD...",
  "...DOOPPPPPPOOD...",
  "...DOOPPPPPPOOD...",
  "...DHHHHHHHHHHD...",
  "....DDDDDDDDDD....",
  ".....kkkkkkkk.....",
  "..................",
  "..................",
];
/* Solo i pixel del corpo: vuoti, ombra (k), scintille (y/b/g) e occhi (E/W)
   sono esclusi e gestiti a parte. */
const ASSO_BODY_COL = {
  D: "#d24e00", l: "#ffd2a0", o: "#ffb066", O: "#ff8418", H: "#ef6c00",
  C: "#fff6ec", M: "#4a5548", B: "#ffab84", P: "#fff1db",
};
const ASSO_EYE_CELLS = [
  { x: 6, y: 8, w: true }, { x: 7, y: 8 }, { x: 10, y: 8, w: true }, { x: 11, y: 8 },
  { x: 6, y: 9 }, { x: 7, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
];

/* Mascotte Asso in pixel-art — riusata nel tutorial e nell'helper persistente. */
function AssoPixel() {
  return (
              <svg viewBox="0 0 18 22" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                <rect x="8" y="0" width="1" height="1" fill="#ffd24a"/>
                <rect x="2" y="1" width="1" height="1" fill="#5ab0ff"/>
                <rect x="15" y="1" width="1" height="1" fill="#5ad6a6"/>
                <rect x="4" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="5" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="6" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="7" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="8" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="9" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="10" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="11" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="12" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="13" y="2" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="3" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="5" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="6" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="7" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="8" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="9" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="10" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="11" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="12" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="13" y="3" width="1" height="1" fill="#ffd2a0"/>
                <rect x="14" y="3" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="4" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="4" width="1" height="1" fill="#ffd2a0"/>
                <rect x="5" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="6" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="7" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="8" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="9" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="10" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="11" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="12" y="4" width="1" height="1" fill="#ffb066"/>
                <rect x="13" y="4" width="1" height="1" fill="#ffd2a0"/>
                <rect x="14" y="4" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="5" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="5" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="5" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="5" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="5" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="6" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="6" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="6" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="6" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="6" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="7" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="7" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="7" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="7" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="7" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="8" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="8" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="8" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="8" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="8" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="8" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="8" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="8" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="9" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="9" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="9" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="9" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="9" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="9" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="9" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="9" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="10" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="10" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="10" width="1" height="1" fill="#ffab84"/>
                <rect x="6" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="10" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="10" width="1" height="1" fill="#ffab84"/>
                <rect x="13" y="10" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="10" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="11" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="11" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="11" width="1" height="1" fill="#4a5548"/>
                <rect x="8" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="11" width="1" height="1" fill="#4a5548"/>
                <rect x="11" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="11" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="11" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="11" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="12" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="12" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="12" width="1" height="1" fill="#4a5548"/>
                <rect x="9" y="12" width="1" height="1" fill="#4a5548"/>
                <rect x="10" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="12" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="12" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="12" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="13" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="13" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="6" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="7" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="8" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="9" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="10" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="11" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="12" y="13" width="1" height="1" fill="#fff6ec"/>
                <rect x="13" y="13" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="13" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="14" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="6" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="7" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="8" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="9" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="10" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="11" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="12" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="13" y="14" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="14" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="15" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="15" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="15" width="1" height="1" fill="#ff8418"/>
                <rect x="6" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="7" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="8" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="9" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="10" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="11" y="15" width="1" height="1" fill="#fff1db"/>
                <rect x="12" y="15" width="1" height="1" fill="#ff8418"/>
                <rect x="13" y="15" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="15" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="16" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="16" width="1" height="1" fill="#ff8418"/>
                <rect x="5" y="16" width="1" height="1" fill="#ff8418"/>
                <rect x="6" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="7" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="8" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="9" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="10" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="11" y="16" width="1" height="1" fill="#fff1db"/>
                <rect x="12" y="16" width="1" height="1" fill="#ff8418"/>
                <rect x="13" y="16" width="1" height="1" fill="#ff8418"/>
                <rect x="14" y="16" width="1" height="1" fill="#d24e00"/>
                <rect x="3" y="17" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="5" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="6" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="7" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="8" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="9" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="10" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="11" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="12" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="13" y="17" width="1" height="1" fill="#ef6c00"/>
                <rect x="14" y="17" width="1" height="1" fill="#d24e00"/>
                <rect x="4" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="5" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="6" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="7" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="8" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="9" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="10" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="11" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="12" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="13" y="18" width="1" height="1" fill="#d24e00"/>
                <rect x="5" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="6" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="7" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="8" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="9" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="10" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="11" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <rect x="12" y="19" width="1" height="1" fill="rgba(0,0,0,0.15)"/>
                <g className="irg-tut-eyes"><rect x="6" y="8" width="1" height="1" fill="#ffffff"/><rect x="7" y="8" width="1" height="1" fill="#4a5548"/><rect x="10" y="8" width="1" height="1" fill="#ffffff"/><rect x="11" y="8" width="1" height="1" fill="#4a5548"/><rect x="6" y="9" width="1" height="1" fill="#4a5548"/><rect x="7" y="9" width="1" height="1" fill="#4a5548"/><rect x="10" y="9" width="1" height="1" fill="#4a5548"/><rect x="11" y="9" width="1" height="1" fill="#4a5548"/></g>
              </svg>
  );
}

/* ====================== 10. COMPONENTE PRINCIPALE ====================== */

export default function IsoRoomGame({
  roomName = "Sala Tornei",
  username = "PrincessLeo",
  formatName = "",
  modeName = "Heads-Up",
  tournaments: pTournaments,
  inventory: pInventory = [],
  onCreateTournament,
  onJoinTournament,
  onObserveTournament,
  onCreateDeck,
  onExitToSimple,
  quality: qualityProp = "auto",
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
  const [room, setRoom] = useState("tournament");
  const [muted, setMuted] = useState(false);
  const [hint, setHint] = useState(true);
  const [newDeckId, setNewDeckId] = useState(null);
  const [look, setLookState] = useState(() => ({ ...DEFAULT_LOOK }));
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialCaption, setTutorialCaption] = useState(null);
  const [tutorialIntro, setTutorialIntro] = useState(false);
  const [tutorialOutro, setTutorialOutro] = useState(false);
  const [tutorialUiSpot, setTutorialUiSpot] = useState(null);
  const [typedCaption, setTypedCaption] = useState("");
  const [typing, setTyping] = useState(false);
  // Helper Asso persistente: compare a destra una volta finito il tutorial.
  const [helperVisible, setHelperVisible] = useState(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem("irg-tutorial-done") === "1") return true;
    return false;
  });
  const [helperBubble, setHelperBubble] = useState(null);
  const helperBubbleTimeoutRef = useRef(null);
  const helperLineIdxRef = useRef(-1);
  const tutorialWasActiveRef = useRef(false);
  const tutorialConfirmRef = useRef(false);
  const nextRedoAtRef = useRef(0);
  const [powering, setPowering] = useState(false);
  const [quality, setQuality] = useState(() => {
    const saved = loadQuality();
    return resolveQuality(saved || qualityProp);
  });
  const fx = useMemo(() => getFxFlags(quality), [quality]);
  const [data, setData] = useState(() => ({
    tournaments: pTournaments || mockTournaments(),
  }));
  const inventory = pInventory || [];

  apiRef.current.openModal = (id) => { if (mountedRef.current) setModal(id); };
  apiRef.current.setRoom = (r) => { if (mountedRef.current) setRoom(r); };
  apiRef.current.hideHint = () => { if (mountedRef.current) setHint(false); };
  apiRef.current.setTutorial = (v) => { if (mountedRef.current) { setTutorialActive(v); if (!v) { setTutorialIntro(false); setTutorialOutro(false); setTutorialUiSpot(null); } } };
  apiRef.current.setTutorialCaption = (t) => { if (mountedRef.current) setTutorialCaption(t); };
  apiRef.current.setTutorialIntro = (v) => { if (mountedRef.current) setTutorialIntro(v); };
  apiRef.current.setTutorialOutro = (v) => { if (mountedRef.current) setTutorialOutro(v); };
  apiRef.current.setTutorialUiSpot = (id) => { if (mountedRef.current) setTutorialUiSpot(id || null); };

  /* effetto "macchina da scrivere" morbido: ogni lettera compare con una breve
     dissolvenza (vedi .irg-tut-ch). Ritmo veloce ma naturale — micro-pause sulla
     punteggiatura — e rispetto di prefers-reduced-motion (testo subito intero). */
  useEffect(() => {
    const full = tutorialCaption || "";
    const chars = Array.from(full);
    if (!chars.length) { setTypedCaption(""); setTyping(false); return; }
    const reduce = typeof window !== "undefined" && window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setTypedCaption(full); setTyping(false); return; }
    setTypedCaption("");
    setTyping(true);
    let i = 0, timer = null, cancelled = false;
    const pauseFor = (ch) => tutPauseMs(ch);
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setTypedCaption(chars.slice(0, i).join(""));
      if (i >= chars.length) { setTyping(false); return; }
      timer = setTimeout(tick, pauseFor(chars[i - 1]));
    };
    timer = setTimeout(tick, TUT_CHAR_MS);
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [tutorialCaption]);

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
  useEffect(() => { if (pInventory) setData((d) => ({ ...d })); }, [pInventory]);

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


  /* mount/unmount del gioco */
  useEffect(() => {
    mountedRef.current = true;
    injectCss();
    let game = null;
    try {
      game = createGame(canvasRef.current, wrapRef.current, apiRef, __debug, {
        stats: statsRef.current,
        fx,
      });
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
    const activeStarted = mine.some((t) => t.status === "iniziata");
    if (g.setBracket) g.setBracket(activeStarted);
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
      if (gameRef.current) gameRef.current.zoomOut();
    }, 150);
  }, []);
  /* il motore chiude la modale (tutorial) tramite lo stesso percorso di chiusura React */
  apiRef.current.closeModal = closeModal;

  const skipTutorial = useCallback(() => {
    if (gameRef.current && gameRef.current.skipTutorial) gameRef.current.skipTutorial();
  }, []);

  const repeatTutorial = useCallback(() => {
    if (gameRef.current && gameRef.current.restartTutorial) gameRef.current.restartTutorial();
  }, []);

  /* Frasi "segnaposto" di Asso: per ora è ancora in addestramento. */
  const HELPER_LINES = useMemo(() => [
    "Sto ancora imparando… tra poco potrò aiutarti! 🃏",
    "Ci sto prendendo la mano: torno presto più utile!",
    "Per ora so solo fare da guida nel tutorial… ma studio in fretta!",
    "Ancora un po' di pratica e sarò il tuo assistente completo! ✨",
    "Sto leggendo un sacco di carte per conoscerle meglio!",
  ], []);

  /* Una volta concluso il tutorial, Asso resta visibile a destra. */
  useEffect(() => {
    if (tutorialActive) {
      tutorialWasActiveRef.current = true;
    } else if (tutorialWasActiveRef.current) {
      setHelperVisible(true);
      nextRedoAtRef.current = Date.now() + 5 * 60 * 1000;
    }
  }, [tutorialActive]);

  const handleHelperClick = useCallback(() => {
    const now = Date.now();
    if (tutorialConfirmRef.current) {
      tutorialConfirmRef.current = false;
      setHelperBubble(null);
      if (helperBubbleTimeoutRef.current) {
        window.clearTimeout(helperBubbleTimeoutRef.current);
        helperBubbleTimeoutRef.current = null;
      }
      try { localStorage.removeItem("irg-tutorial-done"); } catch (e) {}
      if (gameRef.current && gameRef.current.restartTutorial) gameRef.current.restartTutorial();
      return;
    }
    if (now >= nextRedoAtRef.current) {
      tutorialConfirmRef.current = true;
      nextRedoAtRef.current = now + 5 * 60 * 1000;
      setHelperBubble("Vuoi rifare il tutorial? Clicca di nuovo per confermare. 🃏");
      if (helperBubbleTimeoutRef.current) window.clearTimeout(helperBubbleTimeoutRef.current);
      helperBubbleTimeoutRef.current = window.setTimeout(() => {
        setHelperBubble(null);
        tutorialConfirmRef.current = false;
        helperBubbleTimeoutRef.current = null;
      }, 4000);
      return;
    }
    let idx = Math.floor(Math.random() * HELPER_LINES.length);
    if (HELPER_LINES.length > 1 && idx === helperLineIdxRef.current) {
      idx = (idx + 1) % HELPER_LINES.length;
    }
    helperLineIdxRef.current = idx;
    setHelperBubble(HELPER_LINES[idx]);
    if (helperBubbleTimeoutRef.current) window.clearTimeout(helperBubbleTimeoutRef.current);
    helperBubbleTimeoutRef.current = window.setTimeout(() => {
      setHelperBubble(null);
      helperBubbleTimeoutRef.current = null;
    }, 3800);
  }, [HELPER_LINES]);

  useEffect(() => () => {
    if (helperBubbleTimeoutRef.current) window.clearTimeout(helperBubbleTimeoutRef.current);
  }, []);

  /* specchio: applica il look (capelli/outfit) e aggiorna l'avatar nel gioco */
  const applyLook = useCallback((patch) => {
    setLookState((prev) => {
      const next = { ...prev, ...patch };
      if (gameRef.current && gameRef.current.setLook) gameRef.current.setLook(next);
      return next;
    });
  }, []);
  const drawLookPreview = useCallback((canvasEl, lk) => {
    if (gameRef.current && gameRef.current.drawLookPreview) gameRef.current.drawLookPreview(canvasEl, lk);
  }, []);

  /* "Vista semplice": spegne lo schermo (animazione CRT) e passa alla pagina classica */
  const handleSimpleView = useCallback(() => {
    setPowering((on) => {
      if (on) return on;
      if (gameRef.current && gameRef.current.powerOff) gameRef.current.powerOff();
      setTimeout(() => { if (onExitToSimple) onExitToSimple(); }, 640);
      return true;
    });
  }, [onExitToSimple]);

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

  const handleObserve = useCallback((id) => {
    playSfx("success");
    if (onObserveTournament) onObserveTournament(id);
  }, [onObserveTournament, playSfx]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nm = !m;
      if (gameRef.current) gameRef.current.setMuted(nm);
      return nm;
    });
  }, []);

  const toggleQuality = useCallback(() => {
    setQuality((q) => {
      const next = q === "low" ? "high" : "low";
      saveQuality(next);
      if (gameRef.current && gameRef.current.setQuality) {
        gameRef.current.setQuality(next);
      }
      return next;
    });
  }, []);

  const isTouch = typeof window !== "undefined" && "ontouchstart" in window;

  return (
    <div ref={wrapRef} className={"irg-root" + (quality === "low" ? " irg-quality-low" : "") + (powering ? " irg-powering" : "")}>
      <canvas ref={canvasRef} className="irg-canvas" />

      {/* HUD */}
      <div className="irg-chip irg-title"><span aria-hidden>{room === "arcade" ? "🕹️" : "🏆"}</span>{room === "arcade" ? "Sala Arcade" : roomName}</div>
      <div className="irg-controls">
        <button type="button" className="irg-quality" onClick={toggleQuality}
          aria-label={quality === "low" ? "Attiva qualità alta" : "Attiva qualità leggera"}>
          HD{quality === "high" ? " ✓" : ""}
        </button>
        <button type="button" className="irg-mute" onClick={toggleMute}
          aria-label={muted ? "Riattiva audio" : "Silenzia audio"}>
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6.5h2.5L9.5 3v12L5.5 11.5H3z" fill="currentColor" fillOpacity="0.25" />
              <path d="M12.5 6.2l3.5 5.6M16 6.2l-3.5 5.6" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M3 6.5h2.5L9.5 3v12L5.5 11.5H3z" fill="currentColor" fillOpacity="0.25" />
              <path d="M12 6a4 4 0 0 1 0 6M14 4a6.5 6.5 0 0 1 0 10" />
            </svg>
          )}
        </button>
      </div>
      <div className={"irg-chip irg-hint" + (hint ? "" : " irg-off")}>
        {isTouch ? "TOCCA PER MUOVERTI" : room === "arcade" ? "CLICCA PER MUOVERTI · WASD · 1/2/3 CABINATI · 4 DUELLO · ESC TORNEI" : "CLICCA PER MUOVERTI · WASD · 1/2/3 OGGETTI"}
      </div>
      <div className="irg-keys">
        {room === "arcade" ? (
          <>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(1)}>
              <b>Tasto 1</b><span>Stack Attack</span>
            </button>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(2)}>
              <b>Tasto 2</b><span>TCG Jump</span>
            </button>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(3)}>
              <b>Tasto 3</b><span>Card Memory</span>
            </button>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(4)}>
              <b>Tasto 4</b><span>Tavolo Duello</span>
            </button>
          </>
        ) : (
          <>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(1)}>
              <b>Tasto 1</b><span>PC · Tornei</span>
            </button>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(2)}>
              <b>Tasto 2</b><span>Tavolo · Deck</span>
            </button>
            <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey(3)}>
              <b>Tasto 3</b><span>Bacheca · Crea</span>
            </button>
          </>
        )}
        <button type="button" className="irg-key" onClick={() => gameRef.current && gameRef.current.hotkey("P")}>
          <b>Tasto P</b><span>Foto 📸</span>
        </button>
      </div>

      {/* passa alla vista semplice (pagina classica, senza mini-gioco) */}
      <button
        type="button"
        className="irg-simple-btn"
        onClick={handleSimpleView}
        aria-label="Passa alla vista semplice, senza mini-gioco"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <rect x="2" y="2.5" width="12" height="11" rx="1.6" />
          <path d="M2 6h12M5 9.2h6M5 11.2h4" strokeLinecap="round" />
        </svg>
        Vista semplice
      </button>

      {/* tutorial guidato: cartello di benvenuto al centro che poi vola in alto
          come barra di narrazione; alla fine si ri-ingrandisce con le scelte */}
      {tutorialActive && (
        <div className={"irg-tut" + (tutorialIntro ? " irg-tut-intro" : "") + (tutorialOutro ? " irg-tut-final" : "")}>
          <div className="irg-tut-bar">
            <span className="irg-tut-ghost" aria-hidden>
              <AssoPixel />
            </span>
            <span className="irg-tut-text">
              <span className="irg-tut-reserve" aria-hidden>{tutorialCaption ? renderTutReserve(tutorialCaption) : TUT_WAIT}</span>
              <span className="irg-tut-typed">
                {!tutorialCaption && !typedCaption && TUT_WAIT}
                {tutorialCaption && renderTutTyped(typedCaption, tutorialCaption)}
                {typing && <span className="irg-tut-caret" aria-hidden />}
              </span>
            </span>
            {tutorialIntro && !tutorialOutro ? (
              <span className="irg-tut-dur irg-tut-dur-intro">{TUT_DURATION_LABEL}</span>
            ) : null}
            {tutorialOutro ? (
              <div className="irg-tut-actions">
                <div className="irg-tut-repeat">
                  <span className="irg-tut-q">Tutto chiaro?</span>
                  <button type="button" className="irg-tut-btn irg-tut-yes" onClick={skipTutorial}>Sì</button>
                  <button type="button" className="irg-tut-btn irg-tut-no" onClick={repeatTutorial}>No</button>
                </div>
                <button type="button" className="irg-tut-btn irg-tut-simple" onClick={handleSimpleView}>
                  Passa alla modalità semplificata
                </button>
              </div>
            ) : (
              <div className="irg-tut-side">
                <button
                  type="button"
                  className="irg-tut-skip"
                  onClick={skipTutorial}
                  aria-label={`Salta tutorial (${TUT_DURATION_LABEL})`}
                >
                  Salta tutorial
                </button>
                <span className="irg-tut-dur" aria-hidden>
                  {TUT_DURATION_LABEL}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* punti caldi: cerchi + cartelli sugli elementi chiave della modale
          aperta dal tutorial (solo durante la guida, non a chiusura in corso) */}
      {tutorialActive && modal && !closing && (
        <TutorialHotspots wrapRef={wrapRef} modalId={modal} />
      )}
      {tutorialActive && tutorialUiSpot && (
        <TutorialHotspots wrapRef={wrapRef} uiId={tutorialUiSpot} />
      )}

      {/* modali */}
      {modal === "board" && (
        <ModalShell id="board" closing={closing} onClose={closeModal} className="irg-m-board">
          <BoardModal onPublish={handlePublish} onClose={closeModal} playSfx={playSfx} />
        </ModalShell>
      )}
      {modal === "decks" && (
        <ModalShell id="decks" closing={closing} onClose={closeModal} className="irg-m-decks irg-m-decks-wide">
          <DecksModal inventory={inventory} />
        </ModalShell>
      )}
      {modal === "pc" && (
        <ModalShell id="pc" closing={closing} onClose={closeModal} className="irg-m-pc">
          <PcModal tournaments={data.tournaments} onJoin={handleJoin} onObserve={handleObserve} me={username} formatName={formatName} modeName={modeName} />
        </ModalShell>
      )}
      {modal === "mirror" && (
        <ModalShell id="mirror" closing={closing} onClose={closeModal} className="irg-m-mirror">
          <MirrorModal look={look} onChange={applyLook} drawPreview={drawLookPreview} />
        </ModalShell>
      )}

      {/* Sala Arcade — modali dei cabinati e del tavolo kakegurui */}
      {modal === "arcade1" && (
        <ModalShell id="arcade1" closing={closing} onClose={closeModal} className="irg-m-arcade">
          <ArcadeGameModal gameId="arcade1" onExit={closeModal} username={username} />
        </ModalShell>
      )}
      {modal === "arcade2" && (
        <ModalShell id="arcade2" closing={closing} onClose={closeModal} className="irg-m-arcade">
          <ArcadeGameModal gameId="arcade2" onExit={closeModal} username={username} />
        </ModalShell>
      )}
      {modal === "arcade3" && (
        <ModalShell id="arcade3" closing={closing} onClose={closeModal} className="irg-m-arcade">
          <ArcadeGameModal gameId="arcade3" onExit={closeModal} username={username} />
        </ModalShell>
      )}
      {modal === "kakegurui" && (
        <ModalShell id="kakegurui" closing={closing} onClose={closeModal} className="irg-m-arcade">
          <ArcadeGameModal gameId="kakegurui" onExit={closeModal} username={username} />
        </ModalShell>
      )}

      {/* Asso persistente: resta a destra dopo il tutorial, cliccabile. */}
      {helperVisible && (
        <div
          className={"irg-helper" + (helperBubble ? " irg-helper-talking" : "")}
          onClick={handleHelperClick}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleHelperClick(); } }}
          role="button"
          tabIndex={0}
          aria-label="Asso, la tua guida"
          title="Asso"
        >
          {helperBubble && (
            <div className="irg-helper-bubble" role="status">{helperBubble}</div>
          )}
          <span className="irg-helper-asso" aria-hidden><AssoPixel /></span>
        </div>
      )}
    </div>
  );
}
/* fine IsoRoomGame — guida Asso */
