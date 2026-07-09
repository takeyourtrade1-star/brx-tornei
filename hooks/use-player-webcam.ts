'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocalWebcam } from '@/hooks/use-local-webcam';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import type { WebcamSource } from '@/types/webcam';

/** Solo microfono: per gli stream salvati senza audio (es. video dal telefono). */
const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

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

  // Se lo stream salvato non ha audio (video dal telefono), il microfono si
  // prende comunque dal PC e si unisce al video: i giocatori devono parlarsi.
  const [storedWithMic, setStoredWithMic] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!active || !useStored || !storedStream) {
      setStoredWithMic(null);
      return;
    }
    const video = storedStream;
    if (video.getAudioTracks().length > 0) {
      setStoredWithMic(video);
      return;
    }

    let cancelled = false;
    let mic: MediaStream | null = null;

    async function addMic() {
      try {
        mic = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS);
      } catch {
        mic = null; // senza microfono si prosegue col solo video
      }
      if (cancelled) {
        mic?.getTracks().forEach((t) => t.stop());
        return;
      }
      setStoredWithMic(
        mic ? new MediaStream([...video.getVideoTracks(), ...mic.getAudioTracks()]) : video,
      );
    }

    void addMic();

    return () => {
      cancelled = true;
      mic?.getTracks().forEach((t) => t.stop());
    };
  }, [active, useStored, storedStream]);

  const stream = useStored ? (active ? storedWithMic : storedStream) : pcStream;
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
