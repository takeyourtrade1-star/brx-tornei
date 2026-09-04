import { useEffect, useState } from 'react';
import { getFxFlags } from '../quality-config';
import { mountWorldStyles } from './world-styles';

/** Confine React/Canvas: un motore per mount, aggiornamenti espliciti e cleanup. */
export function useWorldEngine({ createGame, canvasRef, wrapRef, gameRef, apiRef, options, quality, muted, paused, debug }) {
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const removeStyles = mountWorldStyles();
    let game;
    try {
      game = createGame(canvasRef.current, wrapRef.current, apiRef, debug, {
        ...options, fx: getFxFlags(quality),
        onError: () => setError('La stanza si è fermata. Riprova per riaprirla.'),
      });
      gameRef.current = game;
      game.setMuted(muted);
      game.setPaused?.(paused);
      setError(null);
    } catch (cause) {
      console.error('[Asso World] Avvio non riuscito:', cause);
      setError('Non siamo riusciti ad aprire Asso World. Puoi riprovare.');
    }
    return () => {
      game?.destroy();
      gameRef.current = null;
      removeStyles();
    };
    // Opzioni iniziali intenzionalmente lette soltanto all'avvio del motore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  useEffect(() => { gameRef.current?.setQuality(quality); }, [gameRef, quality]);
  useEffect(() => { gameRef.current?.setMuted(muted); }, [gameRef, muted]);
  useEffect(() => { gameRef.current?.setPaused?.(paused); }, [gameRef, paused]);
  return { error, generation: attempt, retry: () => setAttempt((current) => current + 1) };
}
