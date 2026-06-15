'use client';

/**
 * Holder globale del flusso "webcam telefono" attivo.
 *
 * Quando il PC riceve il video del telefono e l'utente conferma, lo stream
 * (e la funzione per chiuderlo) vengono passati qui: così il resto dell'app
 * — la vista match dentro il minigioco — può consumarlo come webcam del
 * giocatore senza ri-negoziare la connessione. `subscribe` notifica subito
 * lo stato corrente.
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
