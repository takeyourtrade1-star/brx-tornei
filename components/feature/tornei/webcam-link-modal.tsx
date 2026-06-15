'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import { useWebcamReceiver } from '@/hooks/use-webcam-receiver';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import { hasTurn } from '@/lib/webrtc/ice-config';

interface WebcamLinkModalProps {
  open: boolean;
  /** Procede con l'azione (dopo webcam o "salta"). */
  onConfirm: () => void;
  onCancel: () => void;
  /** Azione in corso. */
  busy?: boolean;
  /** Etichetta del bottone di conferma ("Crea Torneo" | "Partecipa"). */
  confirmLabel?: string;
}

/**
 * Primo passo del "Crea Torneo": inquadra il QR col telefono per usarlo come
 * webcam. Mostra QR + istruzioni finché il telefono non si collega, poi
 * l'anteprima live a bassa latenza e il pulsante per creare il torneo.
 */
export function WebcamLinkModal({
  open,
  onConfirm,
  onCancel,
  busy,
  confirmLabel = 'Crea Torneo',
}: WebcamLinkModalProps) {
  const { sessionId, state, rtt, stream, start, stop, detach } = useWebcamReceiver();
  const [url, setUrl] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(`${window.location.origin}/tornei/webcam/${sessionId}`);
    start();
    return () => stop();
  }, [open, sessionId, start, stop]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  if (!open) return null;

  const connected = state === 'connected' && !!stream;

  function handleConfirm() {
    // Mantiene vivo il link e cede lo stream al match prima di chiudere.
    if (stream) {
      const ctrl = detach();
      webcamLink.set(stream, () => ctrl?.stop());
    }
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
        aria-hidden
      />

      <div className="brx-glass relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 p-6 sm:p-7">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Chiudi"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="mb-5 flex items-start gap-3 pr-10">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#FF7300]/40 bg-[#FF7300]/15 text-[#FF7300]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
              Usa il telefono come webcam
            </h2>
            <p className="mt-0.5 text-sm text-white/60">
              Le webcam dei PC spesso sono scadenti: collega la fotocamera del telefono per un&apos;inquadratura nitida.
            </p>
          </div>
        </header>

        {!connected ? (
          <section className="space-y-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/15 bg-white p-3 shadow-inner">
                {url ? (
                  <QRCodeSVG value={url} size={172} level="M" includeMargin={false} />
                ) : (
                  <div className="h-[172px] w-[172px]" />
                )}
              </div>

              <ol className="flex-1 space-y-2.5">
                {[
                  'Inquadra questo QR con la fotocamera del telefono.',
                  'Apri il link e consenti l’accesso alla fotocamera.',
                  'Torna qui: l’anteprima comparirà da sola.',
                ].map((stepText, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/75">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#FF7300] text-[11px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{stepText}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[12px] text-white/60">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
              {state === 'waiting' || state === 'connecting'
                ? 'In attesa del telefono…'
                : 'Preparazione del canale…'}
            </div>

            {!hasTurn() && (
              <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-white/45">
                <Wifi className="h-3.5 w-3.5" />
                Per la latenza minima tieni telefono e PC sulla stessa rete Wi-Fi.
              </p>
            )}

            <p className="truncate text-center text-[10px] text-white/30 select-all">{url}</p>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black/60">
              <video
                ref={videoRef}
                className="aspect-video w-full object-cover"
                muted
                playsInline
                autoPlay
              />
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Connesso{rtt != null ? ` · ${rtt} ms` : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="brx-liquid-glass-btn flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-bold uppercase tracking-wide text-white disabled:pointer-events-none disabled:opacity-50"
            >
              {busy ? 'Attendere…' : confirmLabel}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </section>
        )}

        <footer className="mt-5 border-t border-white/10 pt-3 text-center">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="text-[12px] text-white/45 underline-offset-2 transition hover:text-white/75 hover:underline disabled:opacity-40"
          >
            Salta e continua senza webcam
          </button>
        </footer>
      </div>
    </div>
  );
}
