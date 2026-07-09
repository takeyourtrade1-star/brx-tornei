'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const PC_WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: 'user',
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24 },
  },
  // Microfono insieme alla camera: i giocatori si parlano durante il match.
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
};

function mapCameraError(name?: string): string | null {
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permesso webcam negato. Consentilo nel browser per continuare.';
  }
  if (name === 'NotFoundError') return 'Nessuna webcam trovata sul dispositivo.';
  if (name === 'NotReadableError') return 'La webcam è già in uso da un’altra app.';
  return null;
}

/**
 * Webcam locale del PC. Si avvia solo quando `enabled` è true.
 * `detach()` cede lo stream senza fermarlo alla pulizia dell'hook.
 */
export function useLocalWebcam(enabled: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detachedRef = useRef(false);

  const detach = useCallback((): MediaStream | null => {
    detachedRef.current = true;
    const s = streamRef.current;
    streamRef.current = null;
    return s;
  }, []);

  useEffect(() => {
    detachedRef.current = false;
    if (!enabled) {
      if (!detachedRef.current) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
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
        let media: MediaStream;
        try {
          media = await navigator.mediaDevices.getUserMedia(PC_WEBCAM_CONSTRAINTS);
        } catch {
          // Microfono assente o negato: si prosegue col solo video.
          media = await navigator.mediaDevices.getUserMedia({
            ...PC_WEBCAM_CONSTRAINTS,
            audio: false,
          });
        }
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
        setError(mapCameraError(name) ?? 'Impossibile avviare la webcam.');
        setStream(null);
      }
    }

    void start();

    return () => {
      cancelled = true;
      if (!detachedRef.current) {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      }
      streamRef.current = null;
    };
  }, [enabled]);

  return { stream, error, detach };
}
