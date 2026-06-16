'use client';

import { useEffect, useRef, useState } from 'react';

const FACE_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
  },
  audio: false,
};

function mapCameraError(name?: string): string | null {
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permesso webcam del PC negato. Consentila nel browser per inquadrare il volto.';
  }
  if (name === 'NotFoundError') return 'Nessuna webcam trovata sul PC.';
  if (name === 'NotReadableError') return 'La webcam del PC è già in uso da un’altra app.';
  return null;
}

/**
 * Webcam locale del PC (volto). Si avvia solo quando `enabled` è true e si
 * ferma automaticamente alla pulizia.
 */
export function useLocalWebcam(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
      setError(null);
      return;
    }

    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setError('Webcam non supportata in questo browser.');
        return;
      }
      try {
        const media = await navigator.mediaDevices.getUserMedia(FACE_CONSTRAINTS);
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = media;
        setStream(media);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const name = (err as { name?: string })?.name;
        setError(mapCameraError(name) ?? 'Impossibile avviare la webcam del PC.');
        setStream(null);
      }
    }

    void start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [enabled]);

  return { stream, error };
}
