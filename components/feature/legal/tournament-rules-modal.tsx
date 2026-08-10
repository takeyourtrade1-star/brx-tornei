'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { TournamentRulesText } from './tournament-rules-text';

interface TournamentRulesModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal con il regolamento + informativa sintetica dei tornei. Aperto sia
 * dalla prima attivazione del gamertag sia dal drawer profilo (rilettura).
 * Portal su body e z-index alto: funziona anche sopra il drawer profilo.
 */
export function TournamentRulesModal({ open, onClose }: TournamentRulesModalProps) {
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Esc chiude il modal; stopImmediatePropagation evita che lo stesso Esc
  // chiuda anche un drawer sottostante (entrambi ascoltano su document).
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => closeRef.current?.focus(), 20);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Regolamento e informativa privacy dei tornei"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-900/[0.06] px-6 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Tornei Ebartex
            </p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-header-bg">
              Regolamento e informativa privacy
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-900/[0.1] bg-white text-slate-500 transition hover:border-slate-900/25 hover:text-header-bg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <TournamentRulesText />
        </div>
      </div>
    </div>,
    document.body,
  );
}
