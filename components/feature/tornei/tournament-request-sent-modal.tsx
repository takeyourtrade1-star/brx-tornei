'use client';

import { CheckCircle2, X } from 'lucide-react';

interface TournamentRequestSentModalProps {
  open: boolean;
  requestLabel: string;
  onClose: () => void;
}

export function TournamentRequestSentModal({
  open,
  requestLabel,
  onClose,
}: TournamentRequestSentModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="brx-glass relative w-full max-w-sm rounded-3xl border border-white/15 p-6 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-black uppercase tracking-wide text-white">
          Richiesta di partecipare inviata
        </h3>
        <p className="mt-1.5 text-sm text-white/60">
          La tua richiesta per il torneo{' '}
          <span className="font-bold capitalize text-marquee">{requestLabel}</span> è stata
          inviata all&apos;organizzatore. Riceverai il QR per la webcam dopo l&apos;approvazione.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="brx-liquid-glass-btn mt-5 w-full rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white"
        >
          Ho capito
        </button>
      </div>
    </div>
  );
}
