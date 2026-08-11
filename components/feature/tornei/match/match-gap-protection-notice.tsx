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
      <section className="mb-4 space-y-3 rounded-2xl border border-primary/35 bg-header-bg/95 p-4.5 text-sm text-white shadow-xl backdrop-blur-md">
        <div className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/15 text-primary">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <div className="space-y-3">
            <div>
              <p className="font-sans text-sm font-black text-white">Decidi se condividere i frammenti mancanti</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-300">
                I frammenti sono ancora soltanto su questo PC. Non salviamo la partita completa:
                con il tuo consenso saranno caricati temporaneamente in uno spazio protetto,
                visibili solo all’avversario per la verifica reciproca e cancellati alla chiusura.
                Se contestati, scadono comunque entro 3 giorni.
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
                Ho letto e acconsento al caricamento temporaneo dei soli frammenti mancanti
                e alla loro visione da parte dell’avversario.
              </span>
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                className="rounded-xl bg-gradient-to-r from-[#FF7300] to-[#e0564d] px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:brightness-110 disabled:opacity-45"
                disabled={!acknowledged || busy}
                onClick={() => void act(onConsent)}
              >
                Carica e condividi
              </button>
              <button
                type="button"
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-white/80 transition hover:bg-white/15 disabled:opacity-45"
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

  const toneStyle = failed
    ? { container: 'border-red-500/30 text-red-100', icon: 'border-red-500/30 bg-red-500/15 text-red-400' }
    : active
      ? { container: 'border-amber-500/30 text-amber-100', icon: 'border-amber-500/30 bg-amber-500/15 text-amber-400' }
      : { container: 'border-emerald-500/30 text-emerald-100', icon: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' };

  return (
    <div className={`mb-4 flex items-center gap-3 rounded-2xl border bg-header-bg/95 p-3.5 text-xs font-semibold shadow-xl backdrop-blur-md ${toneStyle.container}`}>
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border ${toneStyle.icon}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>{message}</span>
    </div>
  );
}
