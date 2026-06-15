'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Video,
} from 'lucide-react';
import { createWebcamSender, type LinkController, type LinkState } from '@/lib/webrtc/webcam-link';

const CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

function mapCameraError(name?: string): string {
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Permesso fotocamera negato. Consentilo nelle impostazioni del browser e riprova.';
  }
  if (name === 'NotFoundError') return 'Nessuna fotocamera disponibile su questo dispositivo.';
  if (name === 'NotReadableError') return 'La fotocamera è già in uso da un’altra app. Chiudila e riprova.';
  return 'Impossibile avviare la fotocamera.';
}

interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

/** Telefono: cattura la fotocamera e la invia al PC come webcam del match. */
export function WebcamPhonePublisher({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<LinkState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctrlRef = useRef<LinkController | null>(null);
  const wakeRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setError(null);
      setState('connecting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
        try {
          const nav = navigator as Navigator & {
            wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> };
          };
          wakeRef.current = (await nav.wakeLock?.request('screen')) ?? null;
        } catch {
          /* wake lock opzionale */
        }
        const ctrl = createWebcamSender(sessionId, stream, { onState: setState });
        ctrlRef.current = ctrl;
        ctrl.start();
      } catch (err) {
        if (cancelled) return;
        setError(mapCameraError((err as { name?: string })?.name));
        setState('failed');
      }
    }

    void boot();

    return () => {
      cancelled = true;
      ctrlRef.current?.stop();
      ctrlRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      void wakeRef.current?.release().catch(() => {});
      wakeRef.current = null;
    };
  }, [sessionId, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const connected = state === 'connected';

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-5 pb-10 pt-8">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FF7300]/30 bg-[#FF7300]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#FF7300]">
        <Video className="h-3.5 w-3.5" />
        Webcam · Ebartex Tornei
      </div>

      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/15 bg-black/60 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 p-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-red-400/40 bg-red-500/15">
              <AlertTriangle className="h-5 w-5 text-red-300" />
            </div>
            <p className="text-sm leading-relaxed text-white/80">{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-1 inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-5 py-2.5 text-sm font-bold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Riprova
            </button>
          </div>
        ) : (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
            {connected ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Collegato al PC
              </>
            ) : (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
                Collegamento…
              </>
            )}
          </div>
        )}
      </div>

      <h1 className="mt-6 text-center text-xl font-black text-white">
        {connected ? 'Sei la webcam del match' : 'Stai per diventare la webcam'}
      </h1>
      <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-white/60">
        {connected
          ? 'Tieni il telefono fermo e ben inquadrato sul piano di gioco. Lascia questa schermata aperta.'
          : 'Consenti l’accesso alla fotocamera. La connessione col PC parte da sola.'}
      </p>

      <div className="mt-auto pt-8 text-center text-[10px] text-white/30">
        Tieni lo schermo acceso · connessione diretta P2P
      </div>
    </main>
  );
}
