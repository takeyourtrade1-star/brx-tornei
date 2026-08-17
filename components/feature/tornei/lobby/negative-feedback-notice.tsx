'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartHandshake, ShieldAlert } from 'lucide-react';
import type { NegativeFeedbackNotice as Notice } from '@/lib/data/player-api-client';

interface NegativeFeedbackNoticeProps {
  userId: string;
  notice: Notice | null;
}

/**
 * Avviso educativo mostrato in lobby dopo la prima valutazione negativa.
 * Il backend applica la finestra di 24 ore; la chiusura resta sul dispositivo
 * per non riproporre lo stesso evento ai refresh periodici della home.
 */
export function NegativeFeedbackNotice({ userId, notice }: NegativeFeedbackNoticeProps) {
  const [open, setOpen] = useState(false);
  const storageKey = useMemo(
    () =>
      notice
        ? `brx-tornei:negative-feedback-notice:${userId}:${notice.receivedAt}`
        : null,
    [notice, userId],
  );

  useEffect(() => {
    if (!storageKey) {
      setOpen(false);
      return;
    }
    try {
      setOpen(window.localStorage.getItem(storageKey) !== 'seen');
    } catch {
      // In navigazione privata lo storage può essere negato: l'avviso resta
      // comunque chiudibile per la sessione corrente.
      setOpen(true);
    }
  }, [storageKey]);

  const close = useCallback(() => {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, 'seen');
      } catch {
        // La chiusura locale deve funzionare anche senza storage persistente.
      }
    }
    setOpen(false);
  }, [storageKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="negative-feedback-title"
        aria-describedby="negative-feedback-description"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-primary/30 bg-header-bg px-6 py-7 text-center text-white shadow-2xl shadow-black/60"
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent"
        />
        <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/35 bg-primary/10 text-primary">
          <ShieldAlert className="h-7 w-7" />
          <HeartHandshake className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-header-bg p-0.5 text-marquee" />
        </span>

        <p className="mt-4 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
          Fair play · Crescere insieme
        </p>
        <h2 id="negative-feedback-title" className="mt-1.5 font-display text-xl font-black">
          Ogni partita è un’occasione per migliorare
        </h2>
        <p
          id="negative-feedback-description"
          className="mt-3 text-sm font-semibold leading-relaxed text-white/65"
        >
          Hai ricevuto una valutazione negativa nelle ultime 24 ore. Prendila come uno spunto:
          gioca con correttezza, ascolta l’altro giocatore e contribuisci a rendere ogni partita
          piacevole e rispettosa per tutti. Se le valutazioni negative dovessero ripetersi, lo
          staff potrà intervenire per tutelare la community.
        </p>

        <button
          type="button"
          onClick={close}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-red-500 px-6 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-lg transition hover:brightness-110 active:scale-95"
        >
          Ho capito
        </button>
      </section>
    </div>
  );
}
