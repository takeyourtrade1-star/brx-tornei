'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Check, ShieldAlert, Sparkles, X } from 'lucide-react';
import type { FeedbackNotice } from '@/lib/data/player-api-client';
import { AssoVisionEyes } from '@/components/feature/scanner/AssoVisionEyes';
import { cn } from '@/lib/utils';

type NoticeKind = 'negative' | 'positive';

interface FeedbackNoticesProps {
  userId: string;
  negativeNotice: FeedbackNotice | null;
  positiveNotice: FeedbackNotice | null;
}

interface NoticeCandidate {
  kind: NoticeKind;
  storageKey: string;
}

function firstUnseen(candidates: NoticeCandidate[]): NoticeCandidate | null {
  try {
    return (
      candidates.find(({ storageKey }) => window.localStorage.getItem(storageKey) !== 'seen') ??
      null
    );
  } catch {
    return candidates[0] ?? null;
  }
}

/** Avvisi una tantum stilizzati con la mascotte Asso come guida di gioco. */
export function FeedbackNotices({
  userId,
  negativeNotice,
  positiveNotice,
}: FeedbackNoticesProps) {
  const [active, setActive] = useState<NoticeCandidate | null>(null);
  const negativeReceivedAt = negativeNotice?.receivedAt;
  const positiveReceivedAt = positiveNotice?.receivedAt;

  const candidates = useMemo(() => {
    const next: NoticeCandidate[] = [];
    if (negativeReceivedAt) {
      next.push({
        kind: 'negative',
        storageKey: `brx-tornei:negative-feedback-notice:${userId}:${negativeReceivedAt}`,
      });
    }
    if (positiveReceivedAt) {
      next.push({
        kind: 'positive',
        storageKey: `brx-tornei:positive-feedback-notice:${userId}:${positiveReceivedAt}`,
      });
    }
    return next;
  }, [negativeReceivedAt, positiveReceivedAt, userId]);

  useEffect(() => setActive(firstUnseen(candidates)), [candidates]);

  const close = useCallback(() => {
    if (!active) return;
    try {
      window.localStorage.setItem(active.storageKey, 'seen');
    } catch {
      // La chiusura locale deve funzionare anche senza storage persistente.
    }
    setActive(
      firstUnseen(candidates.filter(({ storageKey }) => storageKey !== active.storageKey)),
    );
  }, [active, candidates]);

  if (!active) return null;
  const positive = active.kind === 'positive';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] grid place-items-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={close}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="feedback-notice-title"
        aria-describedby="feedback-notice-description"
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-[#182136] via-[#101728] to-[#0a0f1d] px-6 py-7 text-center text-white shadow-2xl shadow-black/80 sm:px-8 sm:py-8 transition-all',
          positive
            ? 'border-2 border-emerald-400/40 shadow-[0_0_50px_-12px_rgba(52,211,153,0.3)]'
            : 'border-2 border-primary/40 shadow-[0_0_50px_-12px_rgba(255,115,0,0.3)]',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Pulsante chiudi rapido */}
        <button
          type="button"
          onClick={close}
          aria-label="Chiudi avviso"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Mascotte Asso Avatar */}
        <div className="relative mx-auto mb-4 flex flex-col items-center">
          <div
            className={cn(
              'relative grid h-16 w-16 place-items-center rounded-2xl border bg-slate-900 shadow-xl ring-4 transition-transform hover:scale-105',
              positive
                ? 'border-emerald-400/50 ring-emerald-500/20'
                : 'border-primary/50 ring-primary/20',
            )}
          >
            <AssoVisionEyes size={50} active />
            <span
              className={cn(
                'absolute -bottom-1.5 -right-1.5 grid h-6 w-6 place-items-center rounded-full border-2 border-[#182136] text-white shadow-sm',
                positive ? 'bg-emerald-500' : 'bg-primary',
              )}
            >
              {positive ? <Sparkles className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            </span>
          </div>

          {/* Badge Mascotte */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-200 backdrop-blur-sm">
            <Bot className="h-3 w-3 text-primary" />
            <span>Asso · La tua Guida</span>
          </div>
        </div>

        {/* Fumetto Mascotte / Titolo */}
        <p
          className={cn(
            'text-[10px] font-black uppercase tracking-[0.2em]',
            positive ? 'text-emerald-300' : 'text-primary',
          )}
        >
          {positive ? 'Valutazione positiva · Continua così' : 'Fair play · Crescere insieme'}
        </p>

        <h2 id="feedback-notice-title" className="mt-1 font-display text-xl font-black tracking-tight sm:text-2xl text-white">
          {positive
            ? 'Il tuo fair play fa la differenza'
            : 'Ogni partita è un’occasione per migliorare'}
        </h2>

        {/* Testo del consiglio */}
        <div className="mt-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-sm">
          <p
            id="feedback-notice-description"
            className="text-xs font-semibold leading-relaxed text-slate-200/90 sm:text-sm"
          >
            {positive ? (
              <>
                Hai ricevuto una valutazione positiva nelle ultime 24 ore. Continua così: il tuo
                atteggiamento aiuta a rendere il gioco più divertente e accogliente per te e per gli
                altri giocatori. Sii d’esempio e porta questo spirito in ogni partita.
              </>
            ) : (
              <>
                Hai ricevuto una valutazione negativa nelle ultime 24 ore. Prendila come uno spunto:
                gioca con correttezza, ascolta l’altro giocatore e contribuisci a rendere ogni partita
                piacevole e rispettosa per tutti. Se le valutazioni negative dovessero ripetersi, lo
                staff potrà intervenire per tutelare la community.
              </>
            )}
          </p>
        </div>

        {/* Bottone d'azione */}
        <button
          type="button"
          onClick={close}
          className={cn(
            'mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 text-xs font-black uppercase tracking-[0.14em] text-white shadow-xl transition hover:brightness-110 active:scale-98',
            positive
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-950/50'
              : 'bg-gradient-to-r from-[#FF7300] to-[#e0564d] shadow-orange-950/50',
          )}
        >
          <Check className="h-4 w-4" />
          <span>{positive ? 'Continua così' : 'Ho capito, grazie Asso'}</span>
        </button>
      </section>
    </div>
  );
}
