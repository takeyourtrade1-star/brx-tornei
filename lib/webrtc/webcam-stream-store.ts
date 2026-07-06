'use client';

import type { WebcamSource } from '@/types/webcam';

/**
 * Holder globale della webcam attiva del giocatore (PC o telefono via QR).
 * Una sola sorgente per partita.
 */

type Listener = () => void;

let current: MediaStream | null = null;
let currentSource: WebcamSource | null = null;
let stopFn: (() => void) | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((l) => l());
}

export const webcamLink = {
  get(): MediaStream | null {
    return current;
  },

  getSource(): WebcamSource | null {
    return currentSource;
  },

  /** Registra sorgente, stream attivo e l'eventuale funzione di chiusura. */
  set(source: WebcamSource, stream: MediaStream | null, stop?: () => void): void {
    currentSource = source;
    current = stream;
    if (stop) stopFn = stop;
    notify();
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
    currentSource = null;
    notify();
  },

  clear(): void {
    this.stop();
  },

  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
