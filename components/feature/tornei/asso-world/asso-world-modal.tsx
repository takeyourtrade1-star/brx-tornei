'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Gamepad2, Loader2, Sparkles, X } from 'lucide-react';
import { requestAssoBetaAction } from '@/actions/asso-world';
import { Button } from '@/components/ui/button';
import { AssoWorldStoryPlayer } from './asso-world-story-player';

interface AssoWorldModalProps {
  open: boolean;
  onClose: () => void;
  onOpenVintageArcade?: () => void;
}

export function AssoWorldModal({
  open,
  onClose,
  onOpenVintageArcade,
}: AssoWorldModalProps) {
  const [mounted, setMounted] = useState(false);
  const [betaPending, startBetaTransition] = useTransition();
  const [betaSuccessMessage, setBetaSuccessMessage] = useState<string | null>(null);
  const [betaError, setBetaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setMounted(true), []);

  // Gestione tasto ESC e blocco scroll di sfondo
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  // Riavvia il video quando il modal si apre
  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay policy ignorata
      });
    }
  }, [open]);

  const handleBetaRequest = () => {
    if (betaPending || betaSuccessMessage) return;
    setBetaError(null);
    startBetaTransition(async () => {
      const res = await requestAssoBetaAction();
      if (res.error) {
        setBetaError(res.error);
        return;
      }
      setBetaSuccessMessage(
        res.message ?? 'Candidatura registrata con successo!',
      );
    });
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 animate-auth-enter">
      {/* Sfondo scuro sfumato dietro la finestra quasi a tutto schermo */}
      <div
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
      />

      {/* Finestra quasi a tutto schermo (full screen quasi) */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Asso World — Anteprima e Beta"
        className="relative flex h-full max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 bg-slate-950 text-white shadow-2xl"
      >
        {/* Video WebM di sottofondo */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/videos/asso-world_building.jpeg"
            className="h-full w-full object-cover scale-[1.02] filter brightness-90 contrast-105"
          >
            <source
              src="/videos/asso-world_building-video.webm"
              type="video/webm"
            />
          </video>
          {/* Sfumature per garantire leggibilità assoluta del testo */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/75" />
          <div className="absolute inset-0 bg-radial-vignette opacity-60 pointer-events-none" />
        </div>

        {/* Intestazione con pulsante X in alto a destra */}
        <header className="relative z-10 flex shrink-0 items-center justify-between px-4 sm:px-6 pt-4 pb-2 sm:pt-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-black tracking-widest text-amber-300 uppercase backdrop-blur-md shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Asso World • Prossimamente</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi anteprima"
            title="Chiudi anteprima (Esc)"
            className="group grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white/80 backdrop-blur-md transition hover:border-white/40 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
          </button>
        </header>

        {/* Centro in sovraimpressione: Fiaba / Storia romanzata animata parola per parola */}
        <div className="relative z-10 flex flex-1 items-center justify-center px-3 sm:px-6 py-2">
          <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-slate-950/75 p-4 sm:p-6 md:p-8 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
            <AssoWorldStoryPlayer />
          </div>
        </div>

        {/* Sezione inferiore centrata: Partecipa alla beta con bottone Richiedi di partecipare */}
        <footer className="relative z-10 shrink-0 border-t border-white/10 bg-slate-950/80 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-xl">
          <div className="mx-auto flex flex-col items-center justify-center text-center max-w-xl">
            <p className="text-xs sm:text-sm font-bold tracking-wide uppercase text-amber-300/90">
              Partecipa alla beta
            </p>
            <p className="mt-0.5 text-xs text-white/70 max-w-md">
              Unisciti ai primi pionieri di Asso World e aiutaci a forgiare il futuro del gioco di carte.
            </p>

            {betaSuccessMessage ? (
              <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-2 text-xs font-semibold text-emerald-300 shadow-md">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{betaSuccessMessage}</span>
              </div>
            ) : (
              <div className="mt-3 flex flex-col sm:flex-row items-center gap-2.5">
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={handleBetaRequest}
                  disabled={betaPending}
                  className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 px-6 py-2.5 text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all hover:from-amber-300 hover:to-yellow-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {betaPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Invio in corso…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span>Richiedi di partecipare</span>
                    </>
                  )}
                </Button>

                {onOpenVintageArcade && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVintageArcade();
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/80 transition-colors underline-offset-4 hover:underline"
                  >
                    <Gamepad2 className="h-3 w-3" />
                    <span>Accesso sala arcade vintage</span>
                  </button>
                )}
              </div>
            )}

            {betaError && (
              <p className="mt-2 text-xs text-rose-400 font-medium">{betaError}</p>
            )}
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
