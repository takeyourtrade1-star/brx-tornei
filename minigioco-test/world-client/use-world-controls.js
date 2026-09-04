import { useCallback, useEffect, useRef, useState } from 'react';
import { loadQuality, resolveQuality, saveQuality } from '../quality-config';

const OFFICIAL = new Set(['pc', 'board', 'decks']);

/** Finestre e preferenze del gioco; i dati ufficiali restano nelle callback della lobby. */
export function useWorldControls({ gameRef, initialRoom, qualityProp, onOpenTournaments, onOpenCreateTournament, onOpenDecks, onExitToSimple }) {
  const [room, setRoom] = useState(initialRoom);
  const [modal, setModal] = useState(null);
  const [closing, setClosing] = useState(false);
  const [hint, setHint] = useState(true);
  const [muted, setMuted] = useState(false);
  const [quality, setQuality] = useState(() => resolveQuality(loadQuality() || qualityProp));
  const [powering, setPowering] = useState(false);
  const closeTimer = useRef(null);
  const exitTimer = useRef(null);
  const modalRef = useRef(modal);
  const exiting = useRef(false);
  modalRef.current = modal;

  useEffect(() => () => {
    window.clearTimeout(closeTimer.current);
    window.clearTimeout(exitTimer.current);
  }, []);

  const openModal = useCallback((id) => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    setClosing(false);
    setModal(id);
  }, []);
  const closeModal = useCallback(() => {
    if (!modalRef.current || closeTimer.current !== null) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setClosing(false);
      setModal(null);
      gameRef.current?.zoomOut();
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
  }, [gameRef]);

  useEffect(() => {
    if (!OFFICIAL.has(modal)) return;
    const callback = modal === 'pc' ? onOpenTournaments
      : modal === 'board' ? onOpenCreateTournament : onOpenDecks;
    setModal(null);
    gameRef.current?.zoomOut();
    if (callback) callback();
    else gameRef.current?.showBubble('Questa funzione è disponibile dalla lobby Ebartex.', 4);
  }, [modal, gameRef, onOpenTournaments, onOpenCreateTournament, onOpenDecks]);

  const handleSimpleView = useCallback(() => {
    if (exiting.current) return;
    exiting.current = true;
    setPowering(true);
    gameRef.current?.powerOff();
    exitTimer.current = window.setTimeout(() => {
      if (onExitToSimple) onExitToSimple();
      else { exiting.current = false; setPowering(false); }
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 640);
  }, [gameRef, onExitToSimple]);

  const setQualityChoice = useCallback((next) => {
    if (next !== 'low' && next !== 'high') return;
    saveQuality(next);
    setQuality(next);
  }, []);
  const toggleMute = useCallback(() => setMuted((current) => !current), []);
  const hideHint = useCallback(() => setHint(false), []);

  return {
    room, modal, closing, hint, muted, quality, powering,
    closeModal, handleSimpleView, setQualityChoice, toggleMute,
    callbacks: { openModal, closeModal, setRoom, hideHint },
  };
}
