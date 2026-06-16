'use client';

/**
 * Holder globale del flusso telefono (mani) attivo via WebRTC/QR.
 *
 * La webcam del volto (PC) si avvia localmente con `useLocalWebcam` nella
 * vista match; non passa da qui.
 */

type Listener = (stream: MediaStream | null) => void;

let current: MediaStream | null = null;
let stopFn: (() => void) | null = null;
const listeners = new Set<Listener>();

export const webcamLink = {
  get(): MediaStream | null {
    return current;
  },
  /** Registra lo stream attivo e l'eventuale funzione di chiusura. */
  set(stream: MediaStream | null, stop?: () => void): void {
    current = stream;
    if (stop) stopFn = stop;
    listeners.forEach((l) => l(current));
  },
  /** Chiude il link e azzera lo stato. */
  stop(): void {
    try {
      stopFn?.();
    } catch {
      /* già chiuso */
    }
    stopFn = null;
    current = null;
    listeners.forEach((l) => l(null));
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    l(current);
    return () => {
      listeners.delete(l);
    };
  },
};
