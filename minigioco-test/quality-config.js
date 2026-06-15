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
      const lowMem = navigator.deviceMemory && navigator.deviceMemory <= 4;
      const saveData = navigator.connection && navigator.connection.saveData;
      if (reduced || lowMem || saveData) return "low";
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

    return {
      // rendering fisico
      dpr: low ? 1 : Math.min(dprBase, 2),

      // effetti canvas pesanti
      particles: !low,      // cuori, zzz, note, scintille generiche
      petParticles: !low,   // particelle extra su gatto/cane
      glows: !low,          // glow monitor, lampada, giradischi
      flicker: !low,        // lampeggio monitor e lampada
      motes: !low,          // pulviscolo nel fascio di luce
      beams: !low,          // fascio di luce dalla finestra
      reflections: !low,    // riflesso notturno dell'avatar
      shadowEffects: !low,  // nebulosa, matrix, carte caotiche, glifi
      holo: !low,           // holo animato sulle carte
      prints: !low,         // orme sul tappeto
      chairSpin: !low,      // sedia che ruota quando ci salta il gatto
      scatter: !low,        // carte sparpagliate con fisica

      // effetti CSS / DOM
      crtScanline: !low,    // scanline CRT sullo schermo PC
      backdropBlur: !low,   // blur sulle modali
      videoHover: !low,     // video MP4 all'hover nella modale PC
      cssAnimations: !low,  // animazioni CSS non essenziali
      sheen: !low,          // riflesso animato sulle carte leggendarie
      ledPulse: !low,       // LED lampeggiante
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
