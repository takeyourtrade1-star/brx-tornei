'use client';

import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Gamepad2, Loader2, X } from 'lucide-react';
import { requestAssoBetaAction } from '@/actions/asso-world';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  const [isFinal, setIsFinal] = useState(false);
  const [storyEnded, setStoryEnded] = useState(false);
  const [betaPending, startBetaTransition] = useTransition();
  const [betaSuccessMessage, setBetaSuccessMessage] = useState<string | null>(null);
  const [betaError, setBetaError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => setMounted(true), []);

  const handleSentenceChange = useCallback((_index: number, final: boolean) => {
    setIsFinal(final);
  }, []);

  const handleStoryEnded = useCallback((ended: boolean) => {
    setStoryEnded(ended);
  }, []);

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

  // Riavvia il video e lo stato all'apertura del modal
  useEffect(() => {
    if (open) {
      setIsFinal(false);
      setStoryEnded(false);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay policy ignorata dal browser
        });
      }
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
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-0 sm:p-2 md:p-3 lg:p-4 animate-auth-enter">
      {/* Sfondo scuro attorno al modal quasi a tutto schermo */}
      <div
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity"
      />

      {/* Finestra cinematografica a tutto schermo */}
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Asso World — Anteprima e Beta"
        className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-none sm:rounded-2xl md:rounded-3xl border-0 sm:border sm:border-white/15 bg-black text-white shadow-2xl"
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
            className="h-full w-full object-cover filter brightness-[0.85] contrast-105"
          >
            <source
              src="/videos/asso-world_building-video.webm"
              type="video/webm"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/75" />
        </div>

        {/* Solo la X in alto a destra */}
        <div className="relative z-30 flex justify-end p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            title="Chiudi (Esc)"
            className="group grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/40 text-white/80 backdrop-blur-md transition hover:border-white/50 hover:bg-black/70 hover:text-white"
          >
            <X className="h-5 w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
          </button>
        </div>

        {/* Cuore centrale: Titolo Asso World + Frase per frase + Bottoni che convergono in centro */}
        <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-2">
          <p
            className="mb-3 sm:mb-5 text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-amber-400/90 text-center select-none"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
          >
            Asso World: Chapter 1 - Rising
          </p>

          <AssoWorldStoryPlayer
            onSentenceChange={handleSentenceChange}
            onStoryEnded={handleStoryEnded}
          />

          {/* CTA: dopo 3s dalla frase finale, frase e indicatori spariscono e i bottoni vanno al centro più grossi del 20% */}
          <div
            className={cn(
              'relative z-20 flex flex-col items-center justify-center px-4 text-center select-none',
              'transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]',
              storyEnded
                ? 'translate-y-0 scale-[1.2] opacity-100 mt-4 sm:mt-6 drop-shadow-[0_8px_36px_rgba(251,191,36,0.45)]'
                : 'translate-y-[14vh] sm:translate-y-[18vh] scale-100 opacity-75 mt-2',
            )}
          >
            <p
              className={cn(
                'text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-amber-300 transition-colors',
                storyEnded && 'text-amber-200 drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]',
              )}
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}
            >
              Partecipa alla beta
            </p>

            {betaSuccessMessage ? (
              <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-400/50 bg-black/70 px-5 py-2.5 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{betaSuccessMessage}</span>
              </div>
            ) : (
              <div className="mt-3 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={handleBetaRequest}
                  disabled={betaPending}
                  className={cn(
                    'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider px-8 py-3 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border border-amber-300/40',
                    isFinal
                      ? 'shadow-[0_0_28px_rgba(251,191,36,0.5)] scale-105'
                      : 'drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]',
                  )}
                >
                  {betaPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Invio in corso…</span>
                    </>
                  ) : (
                    <span>Richiedi di partecipare</span>
                  )}
                </Button>

                {onOpenVintageArcade && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVintageArcade();
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/90 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] underline-offset-4 hover:underline"
                  >
                    <Gamepad2 className="h-3.5 w-3.5" />
                    <span>Accesso sala arcade vintage</span>
                  </button>
                )}
              </div>
            )}

            {betaError && (
              <p
                className="mt-2 text-xs text-rose-400 font-medium"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
              >
                {betaError}
              </p>
            )}
          </div>
        </div>

        {/* Spazio inferiore di bilanciamento visivo per layout flex */}
        <div className="h-10 pointer-events-none select-none" aria-hidden="true" />
      </section>
    </div>,
    document.body,
  );
}
