'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Flag, X } from 'lucide-react';
import type { BestOf } from '@/types/tournament';

interface MatchSurrenderModalProps {
  open: boolean;
  opponentName: string;
  bestOf: BestOf;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Conferma esplicita: la resa assegna una sconfitta, non è una semplice uscita. */
export function MatchSurrenderModal({
  open,
  opponentName,
  bestOf,
  busy,
  onConfirm,
  onClose,
}: MatchSurrenderModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;
  const winsNeeded = bestOf === 'BO5' ? 3 : bestOf === 'BO1' ? 1 : 2;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conferma resa"
      className="fixed inset-0 z-[9999] grid place-items-center bg-black/85 p-4 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-[26px] border border-red-400/25 bg-gradient-to-b from-[#1c1c31] via-[#100f20] to-[#090812] p-6 text-center text-white shadow-2xl shadow-black/80 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Annulla resa"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-red-400/40 bg-red-500/15 text-red-300 shadow-[0_0_28px_rgba(239,68,68,0.25)]">
          <AlertTriangle className="h-8 w-8" aria-hidden />
        </span>
        <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
          Arrendendoti perdi
        </h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">
          La sconfitta contro <strong className="text-white">{opponentName}</strong> verrà
          registrata come <strong className="text-red-300">0 – {winsNeeded}</strong> e la
          partita terminerà per entrambi.
        </p>

        <button
          type="button"
          disabled={busy}
          onClick={onConfirm}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-xs font-black uppercase tracking-wider text-white shadow-[0_16px_35px_-14px_rgba(239,68,68,0.8)] ring-1 ring-white/15 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          <Flag className="h-4 w-4" aria-hidden />
          Conferma resa e sconfitta
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="mt-3 text-[11px] font-black uppercase tracking-wider text-white/45 transition hover:text-white disabled:opacity-40"
        >
          Continua a giocare
        </button>
      </div>
    </div>,
    document.body,
  );
}
