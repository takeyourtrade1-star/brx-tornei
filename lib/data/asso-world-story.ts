/**
 * Narrazione di Asso World.
 * Frasi concise ed autentiche mostrate in sequenza al centro del video,
 * con dissolvenza morbida.
 */

export interface StorySentence {
  id: string;
  text: string;
  durationMs?: number;
}

export const ASSO_WORLD_STORY_SENTENCES: readonly StorySentence[] = [
  {
    id: 'memory',
    text: 'Ti ricordi il brivido di giocare a carte dal vivo? Gli amici al tavolo, gli sguardi complici, il silenzio prima della pescata decisiva.',
    durationMs: 4200,
  },
  {
    id: 'digital',
    text: 'Con l’era digitale quel calore sembrava perduto. Ma per noi di Ebartex le carte sono sempre state legami tra persone, non solo cartoncini.',
    durationMs: 4400,
  },
  {
    id: 'vision',
    text: 'Per questo stiamo costruendo Asso World: il Digitale 2.0 per unire giocatori da tutto il mondo, con la stessa anima di una partita dal vivo... ma a casa tua.',
    durationMs: 4800,
  },
  {
    id: 'seat',
    text: 'Il tuo posto al tavolo ti sta già aspettando.',
    durationMs: 4000,
  },
] as const;

// Compatibilità retroattiva per segmenti completi
export const ASSO_WORLD_STORY_SEGMENTS = ASSO_WORLD_STORY_SENTENCES.map((s) => ({
  id: s.id,
  text: s.text,
}));

export function getStoryWordTokens() {
  const tokens: { index: number; word: string; segmentId: string }[] = [];
  let idx = 0;
  for (const s of ASSO_WORLD_STORY_SENTENCES) {
    for (const w of s.text.trim().split(/\s+/)) {
      tokens.push({ index: idx++, word: w, segmentId: s.id });
    }
  }
  return tokens;
}
