import { useCallback, useEffect, useRef, useState } from 'react';
import { TUT_CHAR_MS, tutPauseMs } from './tutorial-timing';

const TIPS = [
  'Il PC apre i tavoli della lobby. Dal tavolo delle carte puoi gestire i tuoi mazzi.',
  'Apri il guardaroba per provare capelli e abiti: il tuo look ti segue anche in Piazza.',
  'In Piazza trovi chi è connesso. Premi Invio per scrivere, oppure usa un saluto rapido.',
  'Clicca una porta o scegli una stanza: il personaggio raggiunge l’ingresso da solo.',
  'Per un computer meno potente, scegli la grafica Leggera nelle impostazioni.',
];

function tutorialSeen() {
  try { return localStorage.getItem('irg-tutorial-done') === '1'; }
  catch { return false; }
}

/** Stato della guida e digitazione: nessuna richiesta dati, timer sempre rimossi. */
export function useWorldTutorial(gameRef) {
  const [tutorialActive, setActive] = useState(false);
  const [caption, setCaption] = useState(null);
  const [intro, setIntro] = useState(false);
  const [outro, setOutro] = useState(false);
  const [uiSpot, setUiSpot] = useState(null);
  const [typedCaption, setTypedCaption] = useState('');
  const [typing, setTyping] = useState(false);
  const [helperVisible, setHelperVisible] = useState(tutorialSeen);
  const [helperBubble, setHelperBubble] = useState(null);
  const tipIndex = useRef(0);
  const bubbleTimer = useRef(null);

  const setTutorial = useCallback((active) => {
    setActive(active);
    if (!active) {
      setIntro(false);
      setOutro(false);
      setUiSpot(null);
      setHelperVisible(true);
    }
  }, []);

  useEffect(() => {
    const full = caption || '';
    if (!full || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTypedCaption(full);
      setTyping(false);
      return;
    }
    const chars = Array.from(full);
    let index = 0;
    let timer;
    setTypedCaption('');
    setTyping(true);
    const tick = () => {
      index += 1;
      setTypedCaption(chars.slice(0, index).join(''));
      if (index >= chars.length) setTyping(false);
      else timer = window.setTimeout(tick, tutPauseMs(chars[index - 1]));
    };
    timer = window.setTimeout(tick, TUT_CHAR_MS);
    return () => window.clearTimeout(timer);
  }, [caption]);

  useEffect(() => () => window.clearTimeout(bubbleTimer.current), []);

  const skipTutorial = useCallback(() => gameRef.current?.skipTutorial(), [gameRef]);
  const repeatTutorial = useCallback(() => gameRef.current?.restartTutorial(), [gameRef]);
  const onHelperClick = useCallback(() => {
    setHelperBubble(TIPS[tipIndex.current % TIPS.length]);
    tipIndex.current += 1;
    window.clearTimeout(bubbleTimer.current);
    bubbleTimer.current = window.setTimeout(() => setHelperBubble(null), 6500);
  }, []);

  return {
    tutorialActive, caption, intro, outro, uiSpot, typedCaption, typing,
    helperVisible, helperBubble, onHelperClick, skipTutorial, repeatTutorial,
    callbacks: {
      setTutorial, setTutorialCaption: setCaption, setTutorialIntro: setIntro,
      setTutorialOutro: setOutro, setTutorialUiSpot: setUiSpot,
    },
  };
}
