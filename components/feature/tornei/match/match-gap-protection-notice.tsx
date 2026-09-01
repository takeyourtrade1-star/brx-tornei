'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { GapProtectionSnapshot } from '@/lib/gap-recording/types';

export function MatchGapProtectionNotice({
  snapshot,
  onConsent,
  onDecline,
  onRetry,
}: {
  snapshot: GapProtectionSnapshot;
  onConsent: (incidentId: string) => Promise<void>;
  onDecline: (incidentId: string) => Promise<void>;
  onRetry: () => Promise<void>;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setAcknowledged(false);
  }, [snapshot.consentRequest?.incidentId]);
  if (snapshot.status === 'disabled' || snapshot.status === 'unsupported') return null;
  if (snapshot.consentRequiredIncidents > 0) {
    const request = snapshot.consentRequest;
    if (!request) return null;
    const act = async (operation: () => Promise<void>) => {
      setBusy(true);
      try {
        await operation();
      } finally {
        setBusy(false);
      }
    };
    return (
      <section className="mb-4 space-y-3 rounded-2xl border border-primary/35 bg-header-bg/95 p-[18px] text-sm text-white shadow-xl backdrop-blur-md">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="font-sans text-sm font-black text-white">Vuoi inviare il video di sicurezza della disconnessione?</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
                Il video, senza audio, include i 10 secondi precedenti e i 5 successivi
                alla disconnessione. La registrazione è salvata solo su questo PC.
                Se accetti, sarà inviata in modo sicuro al tuo avversario perché possa
                verificare cosa è successo. Verrà cancellata automaticamente dopo la verifica
                (o al massimo entro 3 giorni). Non salviamo mai la partita completa.
              </p>
              <p className="mt-2 text-xs font-bold text-slate-200">
                Incidente 1 di {snapshot.consentRequiredIncidents} ·{' '}
                {(request.byteLength / (1024 * 1024)).toFixed(1)} MB ·{' '}
                {Math.ceil(request.durationMs / 1_000)} secondi
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded accent-[#FF7300]"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={busy}
              />
              <span>
                Acconsento all’invio della registrazione al mio avversario per la verifica.
              </span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:brightness-110 disabled:opacity-45"
                disabled={!acknowledged || busy}
                onClick={() => void act(() => onConsent(request.incidentId))}
              >
                Invia all’avversario
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/80 transition hover:bg-white/15 disabled:opacity-45"
                disabled={busy}
                onClick={() => void act(() => onDecline(request.incidentId))}
              >
                No, cancella la registrazione
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  const active = snapshot.status === 'capturing' || snapshot.status === 'closing';
  const progress = snapshot.upload;
  const uploadPercent = progress?.phase === 'uploading' && progress.totalBytes > 0
    ? Math.min(100, Math.round((progress.uploadedBytes / progress.totalBytes) * 100))
    : null;
  const failed = snapshot.status === 'error' || progress?.phase === 'failed' ||
    snapshot.failedIncidents > 0;
  const retrying = progress?.phase === 'retrying' || snapshot.retryingIncidents > 0;
  const waitingForNetwork = snapshot.waitingForNetwork && snapshot.pendingIncidents > 0;
  const canRetry = progress?.retryable === true || snapshot.retryableFailedIncidents > 0 ||
    snapshot.retryingIncidents > 0;
  const Icon = failed ? TriangleAlert : ShieldCheck;
  const message = failed
    ? snapshot.error ?? progress?.error ?? snapshot.uploadError ??
      'Invio della registrazione non riuscito.'
    : active
      ? 'Connessione instabile: il PC sta salvando il video di sicurezza senza audio.'
      : waitingForNetwork
        ? 'Video pronto. In attesa della connessione per avviare l’invio.'
      : progress?.phase === 'preparing'
        ? 'Preparazione sicura del video…'
        : progress?.phase === 'uploading'
          ? `Caricamento video: ${uploadPercent ?? 0}% · ${progress.completedClips}/${progress.totalClips} clip`
          : progress?.phase === 'finalizing'
            ? 'Caricamento completato. Verifica finale in corso…'
            : progress?.phase === 'sent'
              ? 'Video inviato correttamente all’avversario.'
              : retrying
                ? snapshot.uploadError ?? progress?.error ??
                  'Invio interrotto. Un nuovo tentativo è programmato.'
      : snapshot.pendingIncidents > 0
        ? 'Registrazione pronta: preparazione dell’invio in corso…'
        : 'Protezione video senza audio attiva. La partita completa non viene salvata.';

  const toneStyle = failed
    ? { container: 'border-red-500/30 text-red-100', icon: 'border-red-500/30 bg-red-500/15 text-red-400' }
    : active || retrying || waitingForNetwork || progress?.phase === 'preparing' ||
        progress?.phase === 'uploading' || progress?.phase === 'finalizing'
      ? { container: 'border-amber-500/30 text-amber-100', icon: 'border-amber-500/30 bg-amber-500/15 text-amber-400' }
      : { container: 'border-emerald-500/30 text-emerald-100', icon: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' };

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-2xl border bg-header-bg/95 p-3.5 text-xs font-semibold shadow-xl backdrop-blur-md ${toneStyle.container}`}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${toneStyle.icon}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <span>{message}</span>
        {uploadPercent !== null && (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="Avanzamento invio video"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadPercent}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        )}
      </div>
      {(failed || retrying) && canRetry && (
        <button
          type="button"
          className="shrink-0 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-white transition hover:bg-white/15 disabled:opacity-45"
          disabled={busy}
          onClick={() => void (async () => {
            setBusy(true);
            try {
              await onRetry();
            } finally {
              setBusy(false);
            }
          })()}
        >
          Riprova ora
        </button>
      )}
    </div>
  );
}
