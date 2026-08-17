/**
 * Sticker "provocazione" della chat partita (stile Twitch/videogioco).
 *
 * Viaggiano come normali messaggi di testo nel formato `[sticker:<id>]`:
 * il backend li tratta come chat qualunque (≤500 char, anti-flood), il client
 * li riconosce e li rende come emoji animata in chat + overlay sul video.
 * Un testo che non matcha ESATTAMENTE il formato resta un messaggio normale.
 */

export interface MatchSticker {
  id: string;
  /** Scritta breve sotto l'icona (tono da taunt competitivo). */
  label: string;
  /** Tooltip del pulsante nel picker. */
  title: string;
  /** Classe keyframe applicata allo sticker nell'overlay. */
  animation: string;
  /** Emoji di fallback testuale per notifiche di testo / accessibility. */
  emoji: string;
}

export const MATCH_STICKERS: MatchSticker[] = [
  {
    id: 'fire',
    label: 'ON FIRE!',
    title: 'A fuoco! Combo devastante',
    animation: 'sticker-anim-fire',
    emoji: '🔥',
  },
  {
    id: 'brain',
    label: '500 IQ',
    title: 'Grande giocata calcolata!',
    animation: 'sticker-anim-brain',
    emoji: '🧠',
  },
  {
    id: 'rip',
    label: 'R.I.P.',
    title: 'Spacciato / KO totale',
    animation: 'sticker-anim-skull',
    emoji: '💀',
  },
  {
    id: 'clown',
    label: 'CLOWN PLAY',
    title: 'Che misplay madornale!',
    animation: 'sticker-anim-clown',
    emoji: '🤡',
  },
  {
    id: 'salt',
    label: 'SO SALTY',
    title: 'Sei troppo salato',
    animation: 'sticker-anim-salt',
    emoji: '🧂',
  },
  {
    id: 'topdeck',
    label: 'TOPDECK GOD',
    title: 'Pescata miracolosa!',
    animation: 'sticker-anim-topdeck',
    emoji: '🍀',
  },
  {
    id: 'ez',
    label: 'TOO EZ',
    title: 'Troppo facile, sorseggio tè',
    animation: 'sticker-anim-ez',
    emoji: '☕',
  },
  {
    id: 'tilt',
    label: 'TILTED!',
    title: 'Esplosione / Rabbia e tilt',
    animation: 'sticker-anim-tilt',
    emoji: '💣',
  },
  {
    id: 'crown',
    label: 'BOW DOWN',
    title: 'Inchinatevi al Re',
    animation: 'sticker-anim-crown',
    emoji: '👑',
  },
  {
    id: 'freeze',
    label: 'FREEZE!',
    title: 'Calma e sangue freddo',
    animation: 'sticker-anim-freeze',
    emoji: '🧊',
  },
];

/** Anti-spam lato mittente: uno sticker ogni 4s. */
export const STICKER_COOLDOWN_MS = 4000;

const STICKER_TEXT_RE = /^\[sticker:([a-z]+)\]$/;

const STICKER_ALIASES: Record<string, string> = {
  skull: 'rip',
  lucky: 'topdeck',
  rage: 'tilt',
  shock: 'tilt',
  chill: 'freeze',
  gg: 'crown',
  lol: 'clown',
  cry: 'salt',
};

export function stickerToText(id: string): string {
  return `[sticker:${id}]`;
}

/** Sticker contenuto nel messaggio, o null se è testo normale. */
export function stickerFromText(text: string): MatchSticker | null {
  const match = STICKER_TEXT_RE.exec(text.trim());
  if (!match) return null;
  const rawId = match[1];
  const canonicalId = STICKER_ALIASES[rawId] ?? rawId;
  return MATCH_STICKERS.find((s) => s.id === canonicalId) ?? null;
}
