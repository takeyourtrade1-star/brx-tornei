/* Tavolozza e geometrie semantiche del toy renderer. I valori restano chiusi
 * al contratto persistente di Asso World: sei capelli e cinque outfit. */

export const DEFAULT_CHARACTER_LOOK = Object.freeze({ hair: "m3", outfit: "tank" });

export const CHARACTER_COLORS = Object.freeze({
  skin: "#d69e6f",
  skinLight: "#e9bb8d",
  skinShadow: "#b37d4f",
  skinDeep: "#8f5e38",
  eye: "#263d48",
  mouth: "#914f4c",
  ivory: "#f3ead9",
  ivoryLight: "#fff8ec",
  ivoryShadow: "#c6bda9",
  sole: "#f7f0df",
  denim: "#27272f",
  denimLight: "#373741",
  denimShadow: "#1a1a21",
  walnut: "#684735",
  walnutLight: "#b1784f",
  walnutShadow: "#3d2b2c",
  amber: "#dda05a",
  terracotta: "#a95543",
  petrol: "#285e6a",
  haze: "#dce5dc",
});

export const HAIR_STYLES = Object.freeze({
  m1: { base: "#7a5433", light: "#e3b266", shadow: "#583a20", cut: "crop" },
  m2: { base: "#7a5433", light: "#e3b266", shadow: "#583a20", cut: "buzz" },
  m3: { base: "#6d4729", light: "#b9844d", shadow: "#4a2e1b", cut: "curls" },
  f1: { base: "#7a5433", light: "#e3b266", shadow: "#583a20", cut: "bob" },
  f2: { base: "#7a5433", light: "#e3b266", shadow: "#583a20", cut: "pony" },
  f3: { base: "#684225", light: "#ae7844", shadow: "#422a1a", cut: "long" },
});

export const OUTFIT_STYLES = Object.freeze({
  tank: {
    base: "#2a3037", light: "#4d5a66", shadow: "#11161c", accent: "#e8b13c", kind: "tank",
  },
  hoodie: {
    base: "#e06c2e", light: "#ff9a55", shadow: "#b94b1f", accent: "#ffd36a", kind: "hoodie",
  },
  jacket: {
    base: "#3a4660", light: "#52617f", shadow: "#26304a", accent: "#e8b13c", inner: "#e7e3d8", kind: "jacket",
  },
  shirt: {
    base: "#dfe7f2", light: "#f3f7fc", shadow: "#b9c6da", accent: "#9fb0c6", kind: "shirt",
  },
  jersey: {
    base: "#2f9e6b", light: "#46c08a", shadow: "#1f7350", accent: "#e8b13c", stripe: "#f5f5ee", kind: "jersey",
  },
});

export const PET_STYLES = Object.freeze({
  cat: { body: "#858d8d", light: "#b8c0b9", shadow: "#5b666b", eye: "#dca35c", nose: "#bd7772" },
  dog: { body: "#a87854", light: "#ddbd8d", shadow: "#704b3f", eye: "#3e3333", nose: "#504044" },
});

function own(record, key) {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(record, key);
}

export function resolveCharacterStyle(look) {
  const hair = own(HAIR_STYLES, look?.hair) ? look.hair : DEFAULT_CHARACTER_LOOK.hair;
  const outfit = own(OUTFIT_STYLES, look?.outfit) ? look.outfit : DEFAULT_CHARACTER_LOOK.outfit;
  return { hair: HAIR_STYLES[hair], outfit: OUTFIT_STYLES[outfit], look: { hair, outfit } };
}

export function resolveDirection(direction = "se") {
  const safe = direction === "sw" || direction === "ne" || direction === "nw" ? direction : "se";
  return { id: safe, back: safe === "ne" || safe === "nw", side: safe === "sw" || safe === "nw" ? -1 : 1 };
}

export function rgba(hex, alpha) {
  const value = String(hex).replace("#", "");
  const number = Number.parseInt(value.length === 3 ? value.split("").map((part) => part + part).join("") : value, 16);
  if (!Number.isFinite(number)) return hex;
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return `rgba(${red},${green},${blue},${alpha})`;
}

export function petStyle(type = "cat") {
  return type === "dog" ? PET_STYLES.dog : PET_STYLES.cat;
}
