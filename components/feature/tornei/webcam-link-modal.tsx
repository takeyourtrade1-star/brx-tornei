'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Smartphone,
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
 * Renderizzata via portal su <body> con pannello solido, coerente con la
 * modale "Crea torneo".
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
  const [mounted, setMounted] = useState(false);

  const { sessionId, state, rtt, stream: phoneStream, lastError, start, stop, detach, restart } =
    useWebcamReceiver(externalSessionId);
  const { stream: pcStream, error: pcError, detach: detachPc } = useLocalWebcam(
    open && source === 'pc',
  );

  useEffect(() => setMounted(true), []);

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

  // Esc + scroll-lock (solo mentre la modale è aperta e non è occupata).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'wl-fade 0.2s ease-out' }}
        onClick={busy ? undefined : onCancel}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="webcam-modal-title"
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#0F172A] text-white shadow-[0_-16px_50px_rgba(0,0,0,0.6)] sm:max-h-[90vh] sm:rounded-[1.75rem] sm:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        style={{ animation: 'wl-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <style>{`
          @keyframes wl-fade { from { opacity: 0 } to { opacity: 1 } }
          @keyframes wl-in {
            from { opacity: 0; transform: translateY(24px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Barra accento */}
        <div className="h-1 w-full shrink-0 bg-gradient-to-r from-[#FF7300] to-orange-500" aria-hidden />

        {/* Header */}
        <header className="relative shrink-0 overflow-hidden px-5 pb-4 pt-5">
          <div
            className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full bg-primary/25 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-orange-500 shadow-[0_10px_28px_-6px_rgba(255,115,0,0.6)]">
                <Video className="h-6 w-6 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <h2
                  id="webcam-modal-title"
                  className="font-display text-xl font-black uppercase tracking-wide text-white"
                >
                  Scegli la webcam
                </h2>
                <p className="mt-0.5 text-[12px] font-medium leading-snug text-white/55">
                  Una sola inquadratura per partita: webcam del PC oppure telefono.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              aria-label="Chiudi"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Corpo scrollabile */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              Sorgente
            </p>
            <WebcamSourcePicker value={source} onChange={setSource} disabled={busy} />
          </div>

          {source === 'pc' && pcError && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
            >
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
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-2 text-sm font-bold text-white"
              >
                <RefreshCw className="h-4 w-4" />
                Nuovo QR
              </button>
            </div>
          )}

          {source === 'phone' && !phoneReady && !phoneFailed && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              {insecure && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-200/90">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Per il telefono serve <b>HTTPS</b> e la stessa rete. In dev: <b>npm run dev:lan</b>.
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="shrink-0 rounded-2xl border border-white/15 bg-white p-3">
                  {url ? <QRCodeSVG value={url} size={150} level="M" /> : null}
                </div>
                <ol className="flex-1 space-y-2.5 text-sm text-white/75">
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                      1
                    </span>
                    Inquadra il QR col telefono
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                      2
                    </span>
                    Consenti la fotocamera
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-black text-primary">
                      3
                    </span>
                    Torna qui per l&apos;anteprima
                  </li>
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
            </div>
          )}

          {source === 'pc' && !pcReady && !pcError && (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-10 text-sm text-white/55">
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
        </div>

        {/* Footer azioni */}
        <div className="shrink-0 space-y-2.5 border-t border-white/[0.08] bg-black/25 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {canConfirm ? (
            <button
              type="button"
              onClick={persistAndConfirm}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-orange-500 px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-[0_10px_28px_-6px_rgba(255,115,0,0.55)] transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : null}
              {busy ? 'Attendere…' : confirmLabel}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white/40"
            >
              <Smartphone className="h-4 w-4" />
              In attesa della webcam…
            </button>
          )}

          {onSkip && source === 'phone' && !phoneReady && (
            <button
              type="button"
              onClick={onSkip}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/70 transition hover:bg-white/10 disabled:opacity-50"
            >
              <ScanLine className="h-4 w-4" />
              Salta collegamento telefono
            </button>
          )}

          <button
            type="button"
            onClick={continueWithoutWebcam}
            disabled={busy}
            className="w-full pt-0.5 text-center text-[12px] text-white/45 underline-offset-2 transition hover:text-white/75 hover:underline disabled:opacity-40"
          >
            Continua senza webcam
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
