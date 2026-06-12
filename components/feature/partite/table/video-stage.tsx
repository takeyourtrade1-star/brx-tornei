'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoStageProps {
  opponentName: string;
  micEnabled: boolean;
  onOpponentConnectedChange?: (connected: boolean) => void;
  onLocalStreamReady?: (stream: MediaStream | null) => void;
}

const OPPONENT_CONNECT_DELAY_MS = 3500;

/** Area video WebRTC-ready: avversario a schermo intero, webcam locale in PiP. */
export function VideoStage({
  opponentName,
  micEnabled,
  onOpponentConnectedChange,
  onLocalStreamReady,
}: VideoStageProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Webcam non supportata in questo browser.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        setLocalStream(stream);
        onLocalStreamReady?.(stream);
      } catch {
        setCameraError('Impossibile accedere alla webcam. Controlla i permessi.');
        onLocalStreamReady?.(null);
      }
    }

    void startCamera();

    const connectTimer = window.setTimeout(() => {
      if (!cancelled) {
        setOpponentConnected(true);
        onOpponentConnectedChange?.(true);
      }
    }, OPPONENT_CONNECT_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(connectTimer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onLocalStreamReady, onOpponentConnectedChange]);

  useEffect(() => {
    const video = localVideoRef.current;
    if (!video || !localStream) return;
    video.srcObject = localStream;
    void video.play().catch(() => undefined);
  }, [localStream]);

  useEffect(() => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = micEnabled;
    });
  }, [localStream, micEnabled]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/60 ring-1 ring-white/10">
      {/* Avversario — schermo principale */}
      <div className="absolute inset-0">
        {opponentConnected ? (
          <div className="relative h-full w-full">
            <div
              className="absolute inset-0 bg-gradient-to-br from-primary/30 via-black to-marquee/20"
              aria-hidden
            />
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.08),transparent_55%)]" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
              {opponentName}
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white/50">
            <User className="h-12 w-12" aria-hidden />
            <p className="text-sm font-semibold">In attesa di {opponentName}…</p>
            <p className="text-xs text-white/40">Demo: connessione simulata tra pochi secondi</p>
          </div>
        )}
      </div>

      {/* Webcam locale — PiP */}
      <div
        className={cn(
          'absolute bottom-3 left-3 z-10 overflow-hidden rounded-xl ring-2 ring-white/20',
          'h-24 w-36 sm:h-28 sm:w-44'
        )}
      >
        {localStream && !cameraError ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-white/10 px-2 text-center text-[10px] text-white/60">
            <User className="mb-1 h-5 w-5" />
            {cameraError ?? 'Avvio webcam…'}
          </div>
        )}
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
          Tu
        </span>
      </div>
    </div>
  );
}
