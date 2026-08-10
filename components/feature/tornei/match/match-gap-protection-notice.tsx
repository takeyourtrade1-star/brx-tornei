'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, TriangleAlert } from 'lucide-react';
import type { GapProtectionSnapshot } from '@/lib/gap-recording/types';

export function MatchGapProtectionNotice({
  snapshot,
  onConsent,
  onDecline,
}: {
  snapshot: GapProtectionSnapshot;
  onConsent: () => Promise<void>;
  onDecline: () => Promise<void>;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (snapshot.consentRequiredIncidents === 0) setAcknowledged(false);
  }, [snapshot.consentRequiredIncidents]);
  if (snapshot.status === 'disabled' || snapshot.status === 'unsupported') return null;
  if (snapshot.consentRequiredIncidents > 0) {
    const act = async (operation: () => Promise<void>) => {
      setBusy(true);
      try {
        await operation();
      } finally {
        setBusy(false);
      }
    };
    return (
      <section className="mb-3 rounded-2xl border border-primary/40 bg-card2-end/95 p-4 text-sm text-orange-50 shadow-lg shadow-card2-end/25">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="space-y-3">
            <div>
              <p className="font-bold">Decidi se condividere i frammenti mancanti</p>
              <p className="mt-1 text-xs leading-5 text-orange-100/80">
                I frammenti sono ancora soltanto su questo PC. Non salviamo la partita completa:
                con il tuo consenso saranno caricati temporaneamente in uno spazio protetto,
                visibili solo all’avversario per la verifica reciproca e cancellati alla chiusura.
                Se contestati, scadono comunque entro 3 giorni.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-xs leading-5">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-orange-500"
                checked={acknowledged}
                onChange={(event) => setAcknowledged(event.target.checked)}
                disabled={busy}
              />
              <span>
                Ho letto e acconsento al caricamento temporaneo dei soli frammenti mancanti
                e alla loro visione da parte dell’avversario.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white disabled:opacity-45"
                disabled={!acknowledged || busy}
                onClick={() => void act(onConsent)}
              >
                Carica e condividi
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/80 disabled:opacity-45"
                disabled={busy}
                onClick={() => void act(onDecline)}
              >
                Non caricare ed elimina dal PC
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }
  const active = snapshot.status === 'capturing' || snapshot.status === 'closing';
  const failed = snapshot.status === 'error';
  const Icon = failed ? TriangleAlert : ShieldCheck;
  const message = failed
    ? snapshot.error ?? 'Protezione disconnessioni non disponibile.'
    : active
      ? 'Connessione instabile: il tratto mancante resta protetto su questo PC.'
      : snapshot.pendingIncidents > 0
        ? `${snapshot.pendingIncidents} tratto${snapshot.pendingIncidents > 1 ? 'i' : ''} autorizzato${snapshot.pendingIncidents > 1 ? 'i' : ''} in caricamento protetto.`
        : 'Protezione disconnessioni attiva. La partita completa non viene salvata.';

  return (
    <p
      className={`mb-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg shadow-card2-end/20 ${
        failed
          ? 'border-red-400/25 bg-red-950/85 text-red-100'
          : active
            ? 'border-primary/40 bg-card2-end/95 text-orange-100'
            : 'border-emerald-400/20 bg-emerald-950/80 text-emerald-100/90'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
