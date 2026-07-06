'use client';

import { useSyncExternalStore } from 'react';
import { useLocalWebcam } from '@/hooks/use-local-webcam';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import type { WebcamSource } from '@/types/webcam';

/**
 * Webcam singola del giocatore: usa lo stream salvato dal modale (PC o telefono)
 * oppure avvia la webcam del PC se non è stata scelta una sorgente.
 */
export function usePlayerWebcam(active: boolean) {
  const source = useSyncExternalStore(
    webcamLink.subscribe,
    () => webcamLink.getSource(),
    () => null,
  );
  const storedStream = useSyncExternalStore(
    webcamLink.subscribe,
    () => webcamLink.get(),
    () => null,
  );

  const useStored = (source === 'pc' || source === 'phone') && !!storedStream;
  const { stream: pcStream, error: pcError } = useLocalWebcam(active && !useStored);

  const stream = useStored ? storedStream : pcStream;
  const effectiveSource: WebcamSource | null = source ?? (stream ? 'pc' : null);
  const feedLabel =
    effectiveSource === 'phone' ? 'Telefono' : effectiveSource === 'pc' ? 'PC' : undefined;

  return {
    stream,
    source: effectiveSource,
    feedLabel,
    error: useStored ? null : pcError,
  };
}
