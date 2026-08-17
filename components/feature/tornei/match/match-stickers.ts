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
  emoji: string;
  /** Scritta breve sotto l'emoji (tono da taunt). */
  label: string;
  /** Tooltip del pulsante nel picker. */
  title: string;
  /** Classe keyframe applicata all'emoji nell'overlay (vedi globals.css). */
  animation: string;
}

export const MATCH_STICKERS: MatchSticker[] = [
  {
    id: 'fire',
    emoji: '🔥',
    label: 'FIRE!',
    title: 'A fuoco!',
    animation: 'sticker-anim-fire',
  },
  {
    id: 'brain',
    emoji: '🧠',
    label: '500 IQ',
    title: 'Grande giocata!',
    animation: 'sticker-anim-brain',
  },
  {
    id: 'gg',
    emoji: '👏',
    label: 'GG WP',
    title: 'Bella partita!',
    animation: 'sticker-anim-gg',
  },
  {
    id: 'lucky',
    emoji: '🍀',
    label: 'LUCKY',
    title: 'Topdeck fortunato',
    animation: 'sticker-anim-lucky',
  },
  {
    id: 'shock',
    emoji: '🤯',
    label: 'BOOM!',
    title: 'Incredibile!',
    animation: 'sticker-anim-shock',
  },
  {
    id: 'skull',
    emoji: '💀',
    label: 'RIP',
    title: 'Sono spacciato',
    animation: 'sticker-anim-skull',
  },
  {
    id: 'chill',
    emoji: '☕',
    label: 'CHILL',
    title: 'Calma e gesso',
    animation: 'sticker-anim-chill',
  },
  {
    id: 'ez',
    emoji: '😎',
    label: 'EZ',
    title: 'Troppo facile',
    animation: 'sticker-anim-cool',
  },
  {
    id: 'lol',
    emoji: '🤣',
    label: 'LOL',
    title: 'Ridigli in faccia',
    animation: 'sticker-anim-bounce',
  },
  {
    id: 'rage',
    emoji: '😡',
    label: 'TILT!',
    title: 'Fallo arrabbiare',
    animation: 'sticker-anim-shake',
  },
  {
    id: 'cry',
    emoji: '😭',
    label: 'NOOO',
    title: 'Lacrime amare',
    animation: 'sticker-anim-cry',
  },
  {
    id: 'salt',
    emoji: '🧂',
    label: 'SALTY',
    title: 'Giù di sale',
    animation: 'sticker-anim-salt',
  },
];

/** Anti-spam lato mittente: uno sticker ogni 4s (il backend ha comunque l'anti-flood). */
export const STICKER_COOLDOWN_MS = 4000;

const STICKER_TEXT_RE = /^\[sticker:([a-z]+)\]$/;

export function stickerToText(id: string): string {
  return `[sticker:${id}]`;
}

/** Sticker contenuto nel messaggio, o null se è testo normale. */
export function stickerFromText(text: string): MatchSticker | null {
  const match = STICKER_TEXT_RE.exec(text.trim());
  if (!match) return null;
  return MATCH_STICKERS.find((s) => s.id === match[1]) ?? null;
}
