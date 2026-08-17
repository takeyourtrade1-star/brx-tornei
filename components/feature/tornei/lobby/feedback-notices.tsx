'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { HeartHandshake, ShieldAlert, Sparkles } from 'lucide-react';
import type { FeedbackNotice } from '@/lib/data/player-api-client';
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

/** Avvisi una tantum per la prima valutazione positiva o negativa recente. */
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
    // Se arrivano insieme, il richiamo al fair play ha priorità; il messaggio
    // positivo viene mostrato subito dopo la sua chiusura.
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
      className="fixed inset-0 z-[70] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="feedback-notice-title"
        aria-describedby="feedback-notice-description"
        className={cn(
          'relative w-full max-w-md overflow-hidden rounded-3xl bg-header-bg px-6 py-7 text-center text-white shadow-2xl shadow-black/60',
          positive ? 'border border-emerald-400/30' : 'border border-primary/30',
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent',
            positive ? 'via-emerald-400/70' : 'via-primary/70',
          )}
        />
        <span
          className={cn(
            'relative mx-auto grid h-14 w-14 place-items-center rounded-2xl border',
            positive
              ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
              : 'border-primary/35 bg-primary/10 text-primary',
          )}
        >
          {positive ? <Sparkles className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          <HeartHandshake className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-header-bg p-0.5 text-marquee" />
        </span>

        <p
          className={cn(
            'mt-4 text-[9px] font-black uppercase tracking-[0.2em]',
            positive ? 'text-emerald-300' : 'text-primary',
          )}
        >
          {positive ? 'Valutazione positiva · Continua così' : 'Fair play · Crescere insieme'}
        </p>
        <h2 id="feedback-notice-title" className="mt-1.5 font-display text-xl font-black">
          {positive
            ? 'Il tuo fair play fa la differenza'
            : 'Ogni partita è un’occasione per migliorare'}
        </h2>
        <p
          id="feedback-notice-description"
          className="mt-3 text-sm font-semibold leading-relaxed text-white/65"
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

        <button
          type="button"
          onClick={close}
          className={cn(
            'mt-6 inline-flex h-11 items-center justify-center rounded-xl px-6 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-lg transition hover:brightness-110 active:scale-95',
            positive
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-primary to-red-500',
          )}
        >
          {positive ? 'Continua così' : 'Ho capito'}
        </button>
      </section>
    </div>
  );
}
