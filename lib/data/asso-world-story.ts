/**
 * Struttura narrativa e testo della fiaba di Asso World.
 * Racconta la visione di Ebartex nel ricreare la magia del gioco di carte
 * dal vivo nell'era del Digitale 2.0, unendo giocatori da tutto il mondo.
 */

export interface StorySegment {
  id: string;
  text: string;
  isHeading?: boolean;
}

export const ASSO_WORLD_STORY_SEGMENTS: readonly StorySegment[] = [
  {
    id: 'intro',
    text: "C'era una volta, attorno a un tavolo consumato dal tempo, un rito antico che sapeva di casa.",
    isHeading: true,
  },
  {
    id: 'memories',
    text: "Il fruscio inconfondibile delle carte tra le dita, il silenzio sospeso prima di una pescata decisiva e gli sguardi complici degli amici. Bastava un mazzo e una superficie di legno per sentirsi invincibili, suggellando ogni duello con una sincera stretta di mano che valeva più di qualsiasi trofeo.",
  },
  {
    id: 'distance',
    text: "Poi il mondo ha accelerato il suo passo. L'era digitale ha acceso milioni di schermi, ma spesso ha spento quell'anima viva, rimpiazzando il calore umano con finestre fredde e distanze silenziose. Quel tavolo sembrava destinato a restare solo un dolce ricordo.",
  },
  {
    id: 'the-promise',
    text: 'Ma noi di Ebartex non potevamo rassegnarci a perdere quella magia. È da questa promessa incrollabile che stiamo dando vita ad Asso World.',
    isHeading: true,
  },
  {
    id: 'vision',
    text: 'Stiamo costruendo il Digitale 2.0: non un semplice videogioco, ma un mondo vivo in cui le distanze geografiche svaniscono. Un luogo in cui potrai sederti al tavolo con un giocatore dall’altra parte dell’oceano e ritrovare lo stesso brivido autentico, gli stessi sorrisi e l’inconfondibile complicità di una sfida dal vivo, ma comodamente dal tuo rifugio, a casa tua.',
  },
  {
    id: 'finale',
    text: 'Perché le carte non sono mai state solo pezzi di cartone: sono legami, passione e cuori che battono allo stesso ritmo. Asso World nasce per riportare ognuno di noi a quel tavolo. E la tua sedia ti sta già aspettando.',
  },
] as const;

export interface StoryWordToken {
  index: number;
  word: string;
  segmentId: string;
  isHeading?: boolean;
}

/**
 * Trasforma i segmenti narrativi in un array sequenziale di parole per l'animazione.
 */
export function getStoryWordTokens(): StoryWordToken[] {
  const tokens: StoryWordToken[] = [];
  let currentIndex = 0;

  for (const segment of ASSO_WORLD_STORY_SEGMENTS) {
    const words = segment.text.trim().split(/\s+/);
    for (const word of words) {
      tokens.push({
        index: currentIndex++,
        word,
        segmentId: segment.id,
        isHeading: segment.isHeading,
      });
    }
  }

  return tokens;
}
