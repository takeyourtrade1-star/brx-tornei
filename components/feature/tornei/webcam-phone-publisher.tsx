'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FlipHorizontal,
  Loader2,
  RefreshCw,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { publicConfig } from '@/lib/public-config';
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
export function WebcamPhonePublisher({
  sessionId,
}: {
  sessionId: string;
}) {
  const [state, setState] = useState<LinkState>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [relayReady, setRelayReady] = useState(false);
  const [mirrored, setMirrored] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctrlRef = useRef<LinkController | null>(null);
  const wakeRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function exchangeClaim() {
      const claim = new URLSearchParams(window.location.hash.slice(1)).get('claim');
      window.history.replaceState(null, '', window.location.pathname);
      if (!claim) {
        setError('Codice collegamento mancante. Scansiona di nuovo il QR dal PC.');
        setState('failed');
        return;
      }
      try {
        const response = await fetch(
          `/api/tornei/webcam/${encodeURIComponent(sessionId)}/claim`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ claim }),
            cache: 'no-store',
          },
        );
        const body = (await response.json().catch(() => ({}))) as { ok?: boolean };
        if (!response.ok || body.ok !== true) throw new Error('claim rejected');
        if (!cancelled) setRelayReady(true);
      } catch {
        if (!cancelled) {
          setError('Codice già usato o scaduto. Genera un nuovo QR dal PC.');
          setState('failed');
        }
      }
    }
    void exchangeClaim();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (!relayReady) return;
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
        const ctrl = createWebcamSender(
          sessionId,
          stream,
          {
            onState: setState,
            onError: setError,
          },
        );
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
  }, [sessionId, relayReady, attempt]);

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
          className={cn(
            'absolute inset-0 h-full w-full object-contain transition-transform duration-200',
            mirrored && '-scale-x-100',
          )}
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
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-5 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110 active:scale-95"
              >
                <RefreshCw className="h-4 w-4" />
                Riprova
              </button>
              <a
                href={publicConfig.app.mainSiteUrl}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Torna a Ebartex
              </a>
            </div>
          </div>
        ) : (
          <>
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
            <button
              type="button"
              onClick={() => setMirrored((m) => !m)}
              title={mirrored ? 'Visuale specchiata attiva' : 'Visuale normale (clicca per specchiare)'}
              aria-label="Specchia anteprima webcam"
              className={cn(
                'absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border backdrop-blur-md transition active:scale-95',
                mirrored
                  ? 'border-[#FF7300]/60 bg-[#FF7300]/25 text-[#FF7300]'
                  : 'border-white/20 bg-black/55 text-white/80 hover:bg-black/75 hover:text-white',
              )}
            >
              <FlipHorizontal className="h-4 w-4" />
            </button>
          </>
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
        Tieni lo schermo acceso · collegato al tuo tavolo
      </div>
    </main>
  );
}
