/**
 * Narrazione fiabesca di Asso World.
 * Frasi poetiche mostrate in sequenza al centro del video, una alla volta,
 * con dissolvenza morbida e font da fiaba.
 */

export interface StorySentence {
  id: string;
  text: string;
  /** Durata di lettura raccomandata in millisecondi */
  durationMs?: number;
}

export const ASSO_WORLD_STORY_SENTENCES: readonly StorySentence[] = [
  {
    id: 'intro',
    text: "C'era una volta, attorno a un tavolo consumato dal tempo, un rito antico che sapeva di casa.",
    durationMs: 5000,
  },
  {
    id: 'memories',
    text: "Il fruscio delle carte tra le dita, il silenzio prima dell'ultima pescata e gli sguardi complici degli amici.",
    durationMs: 5200,
  },
  {
    id: 'handshake',
    text: "Bastava un mazzo per sentirsi invincibili, suggellando ogni sfida con una stretta di mano sincera.",
    durationMs: 4800,
  },
  {
    id: 'distance',
    text: "Poi il mondo è andato di fretta. Gli schermi si sono accesi, ma quel tavolo si è allontanato nei ricordi.",
    durationMs: 5000,
  },
  {
    id: 'promise',
    text: "Ma noi di Ebartex non potevamo rassegnarci all'idea di perdere quella magia.",
    durationMs: 4500,
  },
  {
    id: 'vision',
    text: "Così stiamo dando vita ad Asso World: il Digitale 2.0 con un'anima viva, per giocare a carte con persone da tutto il mondo come se fosse dal vivo, ma a casa.",
    durationMs: 6500,
  },
  {
    id: 'bonds',
    text: "Perché le carte non sono mai state semplici pezzi di cartone, ma legami tra cuori.",
    durationMs: 4800,
  },
  {
    id: 'call',
    text: "Il tuo posto al tavolo ti sta già aspettando.",
    durationMs: 5500,
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
