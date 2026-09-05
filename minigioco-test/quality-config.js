/* quality-config.js — impostazioni qualità grafica per IsoRoomGame
 * Flag centralizzati per la modalità "leggera" (PC lenti / risparmio batteria).
 * UMD: funziona sia come modulo CommonJS/ESM che come script standalone (demo.html).
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  } else if (typeof define === "function" && define.amd) {
    define([], function () { return api; });
  } else {
    root.IsoRoomGameQuality = api;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const STORAGE_KEY = "irg-quality";

  const QUALITY_LEVELS = ["high", "low"];

  /** Risolve "auto" in high/low basandosi sul dispositivo/browser. */
  function resolveQuality(input) {
    if (QUALITY_LEVELS.includes(input)) return input;

    if (typeof window === "undefined") return "high";

    try {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const compactViewport = Math.min(
        window.innerWidth || Number.POSITIVE_INFINITY,
        window.screen && window.screen.width ? window.screen.width : Number.POSITIVE_INFINITY,
      ) <= 900;
      const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
      const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
      const saveData = navigator.connection && navigator.connection.saveData;
      if (reduced || (coarsePointer && compactViewport) || lowMem || lowCpu || saveData) return "low";
    } catch (e) {
      // fallback sicuro
    }

    return "high";
  }

  /** Carica la preferenza utente dal localStorage. */
  function loadQuality() {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  /** Salva la preferenza utente nel localStorage. */
  function saveQuality(value) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {
      // noop — storage pieno o bloccato
    }
  }

  /** Restituisce i flag effetti in base alla qualità scelta. */
  function getFxFlags(quality) {
    const low = quality === "low";
    const dprBase = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const reducedMotion = typeof window !== "undefined" && typeof window.matchMedia === "function"
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animated = !low && !reducedMotion;

    return {
      highDetail: !low,
      // rendering fisico
      // In modalita leggera il canvas viene renderizzato sotto la risoluzione CSS
      // e poi ingrandito dal browser: sulla pixel-art resta leggibile e dimezza
      // abbondantemente i pixel da comporre a ogni frame.
      dpr: low ? Math.max(0.5, Math.min(dprBase, 0.75)) : Math.min(dprBase, 1.5),
      targetFps: low ? 30 : 60,
      uiTickMs: low ? 250 : 100,
      reducedMotion: Boolean(reducedMotion),

      // effetti canvas pesanti
      particles: animated, // cuori, zzz, note, scintille generiche
      petParticles: animated, // particelle extra su gatto/cane
      glows: !low,          // glow monitor, lampada, giradischi
      flicker: animated,   // lampeggio monitor e lampada
      motes: animated,     // pulviscolo nel fascio di luce
      beams: !low,          // fascio di luce dalla finestra
      reflections: !low,    // riflesso notturno dell'avatar
      shadowEffects: animated, // nebulosa, matrix, carte caotiche, glifi
      holo: animated,      // holo animato sulle carte
      prints: !low,         // orme sul tappeto
      chairSpin: animated, // sedia che ruota quando ci salta il gatto
      scatter: animated,   // carte sparpagliate con fisica

      // effetti CSS / DOM
      crtScanline: animated, // scanline CRT sullo schermo PC
      backdropBlur: !low,   // blur sulle modali
      videoHover: animated, // video MP4 all'hover nella modale PC
      cssAnimations: animated, // animazioni CSS non essenziali
      sheen: animated,     // riflesso animato sulle carte leggendarie
      ledPulse: animated,  // LED lampeggiante
    };
  }

  return {
    QUALITY_LEVELS,
    resolveQuality,
    loadQuality,
    saveQuality,
    getFxFlags,
  };
});
