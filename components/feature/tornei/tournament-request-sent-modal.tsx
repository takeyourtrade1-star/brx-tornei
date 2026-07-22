'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';
import modalFont from './tournament-modal-font.module.css';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Chiudi"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-sent-title"
        aria-describedby="request-sent-description"
        className={`${modalFont.uiSans} simple-panel-solid relative w-full max-w-md overflow-hidden rounded-b-none text-center sm:rounded-3xl`}
      >
        <div className="h-1 bg-gradient-to-r from-primary to-orange-500" aria-hidden="true" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute right-4 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="px-6 pb-5 pt-7 sm:px-8">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-emerald-400/40 bg-emerald-400/15 text-emerald-300 shadow-[0_14px_36px_-18px_rgba(52,211,153,0.8)]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            Richiesta inviata
          </p>
          <h2 id="request-sent-title" className="mt-1.5 font-sans text-2xl font-black leading-tight tracking-tight text-white">
            Ora tocca all’organizzatore
          </h2>
          <p id="request-sent-description" className="mt-3 text-sm font-medium leading-relaxed text-white/60">
            La richiesta per <span className="font-extrabold capitalize text-marquee">{requestLabel}</span> è partita.
            Riceverai il QR della webcam appena sarà approvata.
          </p>
        </div>
        <footer className="border-t border-white/10 bg-black/20 p-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-gradient-to-r from-primary to-orange-500 px-6 py-3 text-sm font-black text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg"
          >
            Ho capito
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
