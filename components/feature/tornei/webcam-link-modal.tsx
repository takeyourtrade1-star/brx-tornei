'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Monitor,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  Video,
  Wifi,
  X,
} from 'lucide-react';
import { useWebcamReceiver } from '@/hooks/use-webcam-receiver';
import { useLocalWebcam } from '@/hooks/use-local-webcam';
import { WebcamTile } from '@/components/feature/tornei/match/webcam-tile';
import { WebcamSourcePicker } from './webcam-source-picker';
import { webcamLink } from '@/lib/webrtc/webcam-stream-store';
import { hasTurn } from '@/lib/webrtc/ice-config';
import type { WebcamSource } from '@/types/webcam';

interface WebcamLinkModalProps {
  open: boolean;
  externalSessionId?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  confirmLabel?: string;
  onSkip?: () => void;
}

/**
 * Scelta webcam prima della partita: una sola sorgente (PC o telefono via QR).
 */
export function WebcamLinkModal({
  open,
  externalSessionId,
  onConfirm,
  onCancel,
  busy,
  confirmLabel = 'Crea Torneo',
  onSkip,
}: WebcamLinkModalProps) {
  const [source, setSource] = useState<WebcamSource>('pc');
  const [url, setUrl] = useState('');
  const [insecure, setInsecure] = useState(false);

  const { sessionId, state, rtt, stream: phoneStream, lastError, start, stop, detach, restart } =
    useWebcamReceiver(externalSessionId);
  const { stream: pcStream, error: pcError, detach: detachPc } = useLocalWebcam(
    open && source === 'pc',
  );

  useEffect(() => {
    if (!open) return;
    setSource('pc');
  }, [open]);

  useEffect(() => {
    if (!open || source !== 'phone') return;
    setUrl(`${window.location.origin}/tornei/webcam/${sessionId}`);
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    setInsecure(window.location.protocol !== 'https:' || isLocal);
    start();
    return () => stop();
  }, [open, source, sessionId, start, stop]);

  if (!open) return null;

  const phoneReady = source === 'phone' && !!phoneStream;
  const pcReady = source === 'pc' && !!pcStream;
  const phoneFailed = source === 'phone' && (state === 'failed' || state === 'closed') && !phoneReady;
  const previewStream = source === 'phone' ? phoneStream : pcStream;
  const canConfirm = phoneReady || pcReady;

  function persistAndConfirm() {
    if (source === 'phone' && phoneStream) {
      const ctrl = detach();
      webcamLink.set('phone', phoneStream, () => ctrl?.stop());
    } else if (source === 'pc') {
      const s = detachPc();
      if (s) webcamLink.set('pc', s);
    }
    onConfirm();
  }

  function continueWithoutWebcam() {
    webcamLink.clear();
    onConfirm();
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={busy ? undefined : onCancel}
        aria-hidden
      />

      <div className="brx-glass relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 p-6 sm:p-7">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          aria-label="Chiudi"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <header className="mb-4 flex items-start gap-3 pr-10">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#FF7300]/40 bg-[#FF7300]/15 text-[#FF7300]">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
              Scegli la webcam
            </h2>
            <p className="mt-0.5 text-sm text-white/60">
              Una sola inquadratura per partita: webcam del PC oppure telefono.
            </p>
          </div>
        </header>

        <WebcamSourcePicker value={source} onChange={setSource} disabled={busy} />

        <section className="mt-4 space-y-4">
          {source === 'pc' && pcError && (
            <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {pcError}
            </p>
          )}

          {source === 'phone' && phoneFailed && (
            <div className="space-y-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-center">
              <AlertTriangle className="mx-auto h-5 w-5 text-red-300" />
              <p className="text-sm text-white/80">
                {lastError ?? 'Connessione col telefono non riuscita. Stessa rete Wi‑Fi o TURN in produzione.'}
              </p>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-full bg-[#FF7300] px-4 py-2 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Nuovo QR
              </button>
            </div>
          )}

          {source === 'phone' && !phoneReady && !phoneFailed && (
            <>
              {insecure && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-200/90">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Per il telefono serve <b>HTTPS</b> e la stessa rete. In dev: <b>npm run dev:lan</b>.
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="rounded-2xl border border-white/15 bg-white p-3">
                  {url ? <QRCodeSVG value={url} size={160} level="M" /> : null}
                </div>
                <ol className="flex-1 space-y-2 text-sm text-white/75">
                  <li>1. Inquadra il QR col telefono</li>
                  <li>2. Consenti la fotocamera</li>
                  <li>3. Torna qui per l&apos;anteprima</li>
                </ol>
              </div>
              <div className="flex items-center justify-center gap-2 text-[12px] text-white/55">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#FF7300]" />
                In attesa del telefono…
              </div>
              {!hasTurn() && (
                <p className="text-center text-[11px] text-white/45">
                  <Wifi className="mr-1 inline h-3.5 w-3.5" />
                  Video diretto solo sulla stessa Wi‑Fi senza TURN.
                </p>
              )}
            </>
          )}

          {source === 'pc' && !pcReady && !pcError && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin text-[#FF7300]" />
              Avvio webcam del PC…
            </div>
          )}

          {previewStream && (
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-white/15">
              <WebcamTile
                stream={previewStream}
                username="Anteprima"
                feedLabel={source === 'phone' ? 'Telefono' : 'PC'}
              />
              {phoneReady && (
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-emerald-400/40 bg-black/55 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Connesso{rtt != null ? ` · ${rtt} ms` : ''}
                </div>
              )}
              {pcReady && (
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full border border-emerald-400/40 bg-black/55 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                  <Monitor className="h-3.5 w-3.5" />
                  Webcam PC attiva
                </div>
              )}
            </div>
          )}

          {canConfirm && (
            <button
              type="button"
              onClick={persistAndConfirm}
              disabled={busy}
              className="brx-liquid-glass-btn flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
            >
              {busy ? 'Attendere…' : confirmLabel}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          )}

          {onSkip && source === 'phone' && !phoneReady && (
            <button
              type="button"
              onClick={onSkip}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-2.5 text-sm font-bold text-white/70"
            >
              <ScanLine className="h-4 w-4" />
              Salta collegamento telefono
            </button>
          )}
        </section>

        <footer className="mt-4 border-t border-white/10 pt-3 text-center">
          <button
            type="button"
            onClick={continueWithoutWebcam}
            disabled={busy}
            className="text-[12px] text-white/45 underline-offset-2 hover:text-white/75 hover:underline disabled:opacity-40"
          >
            Continua senza webcam
          </button>
        </footer>
      </div>
    </div>
  );
}
