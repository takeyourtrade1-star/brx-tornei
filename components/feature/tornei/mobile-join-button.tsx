'use client';

import { useState } from 'react';
import { Plus, Smartphone, UserPlus, X } from 'lucide-react';
import {
  tournamentActionButtonClass,
  tournamentActionIconClass,
} from './tournament-action-button-styles';

/**
 * Bottone "Partecipa" / "Chiedi di partecipare" della vista MOBILE.
 * Su telefono i tornei non si giocano: al tap spiega che si partecipa dal PC
 * e che questo telefono può essere usato come webcam (inquadrando il QR sul PC).
 */
export function MobileJoinButton({ isPrivate }: { isPrivate?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={tournamentActionButtonClass('sm')}
      >
        {isPrivate ? (
          <UserPlus className={tournamentActionIconClass} />
        ) : (
          <Plus className={tournamentActionIconClass} />
        )}
        {isPrivate ? 'Chiedi di partecipare' : 'Partecipa'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="brx-glass relative w-full max-w-sm rounded-3xl border border-white/15 p-5">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Chiudi"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#FF7300]/40 bg-[#FF7300]/15 text-[#FF7300]">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-black uppercase tracking-wide text-white">
                  Partecipa dal PC
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">
                  I tornei si giocano dal computer. Apri il torneo sul PC e usa questo telefono
                  come <span className="font-bold text-[#FF7300]">webcam</span>: ti basterà
                  inquadrare il QR che comparirà sullo schermo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="brx-liquid-glass-btn mt-5 w-full rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}
    </>
  );
}
