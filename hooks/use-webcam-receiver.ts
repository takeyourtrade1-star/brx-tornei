'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWebcamReceiver,
  type LinkController,
  type LinkState,
} from '@/lib/webrtc/webcam-link';

function makeSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

/**
 * Lato PC: genera una sessione, avvia il ricevitore WebRTC e segue stato,
 * stream ricevuto e RTT. `detach` stacca il controller SENZA chiuderlo (per
 * passare lo stream attivo al match dopo la conferma).
 */
export function useWebcamReceiver() {
  const [sessionId, setSessionId] = useState(makeSessionId);
  const [state, setState] = useState<LinkState>('idle');
  const [rtt, setRtt] = useState<number | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const ctrlRef = useRef<LinkController | null>(null);

  const start = useCallback(() => {
    if (ctrlRef.current) return;
    ctrlRef.current = createWebcamReceiver(sessionId, {
      onStream: setStream,
      onState: setState,
      onRtt: setRtt,
    });
    ctrlRef.current.start();
  }, [sessionId]);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setStream(null);
  }, []);

  /**
   * Riprova da capo: chiude la sessione corrente e ne genera una nuova (quindi
   * un nuovo QR). Chi consuma l'hook deve ri-avviare `start()` quando cambia
   * `sessionId` (lo fa già il modale tramite l'effetto su `sessionId`).
   */
  const restart = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setStream(null);
    setState('idle');
    setRtt(null);
    setSessionId(makeSessionId());
  }, []);

  /** Restituisce il controller e smette di gestirlo (niente stop alla pulizia). */
  const detach = useCallback((): LinkController | null => {
    const c = ctrlRef.current;
    ctrlRef.current = null;
    return c;
  }, []);

  useEffect(() => {
    return () => {
      ctrlRef.current?.stop();
      ctrlRef.current = null;
    };
  }, []);

  return { sessionId, state, rtt, stream, start, stop, detach, restart };
}
