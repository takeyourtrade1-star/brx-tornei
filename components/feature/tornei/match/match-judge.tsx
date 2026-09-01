'use client';

import { useEffect, useRef, type FormEvent } from 'react';
import { ChevronRight, CircleHelp, LoaderCircle, X } from 'lucide-react';
import type { MatchJudgeState } from '@/types/tournament';
import type { MatchJudgeController } from '@/hooks/use-match-judge';
import { AssoMascot } from './asso-mascot';
import { MatchJudgeTranscript } from './match-judge-transcript';

interface MatchJudgeProps {
  matchId: string;
  userId: string;
  participantNames: Record<string, string>;
  judge?: MatchJudgeState;
  matchEnded: boolean;
  controller: MatchJudgeController;
  fullscreen?: boolean;
}

/** Helper e drawer del Judge: una sola composizione, riusata anche in fullscreen. */
export function MatchJudge({
  matchId,
  userId,
  participantNames,
  judge,
  matchEnded,
  controller,
  fullscreen = false,
}: MatchJudgeProps) {
  const {
    isOpen,
    open,
    close,
    draft,
    setDraft,
    pending,
    error,
    acceptedTurn,
    syncJudge,
    submit: submitQuestion,
  } = controller;
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const processing = !matchEnded && (
    pending || judge?.status === 'processing' || acceptedTurn?.status === 'processing'
  );
  const titleId = `match-judge-title-${fullscreen ? 'fullscreen' : 'drawer'}-${matchId}`;

  useEffect(() => {
    syncJudge(judge);
  }, [syncJudge, judge]);

  useEffect(() => {
    if (isOpen && !processing) inputRef.current?.focus();
  }, [isOpen, processing]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [close, isOpen]);

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(draft);
  }

  const layer = fullscreen ? 'z-[1350]' : 'z-[100]';
  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-expanded={isOpen}
        aria-controls={titleId}
        aria-label="Apri la chat del Judge"
        className={`fixed ${fullscreen ? 'right-4 top-24' : 'right-4 top-1/2'} ${layer} inline-flex -translate-y-1/2 items-center gap-2 rounded-2xl border border-amber-300/40 bg-header-bg/95 px-2 py-2 text-white shadow-xl shadow-black/40 backdrop-blur-md transition hover:-translate-y-[calc(50%+2px)] hover:border-amber-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-5`}
      >
        <span className="grid h-12 w-10 place-items-center rounded-xl bg-black/20">
          <AssoMascot variant="judge" size={38} />
        </span>
        <span className="hidden pr-1 text-left sm:block">
          <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-amber-200">Asso</span>
          <span className="block text-xs font-bold text-white">Judge</span>
        </span>
        <ChevronRight className="hidden h-4 w-4 text-white/50 sm:block" aria-hidden />
      </button>

      {isOpen && (
        <div
          className={`fixed inset-0 ${layer} flex items-end justify-end bg-black/45 backdrop-blur-[1px] md:p-4`}
          role="presentation"
          onClick={close}
        >
          <aside
            id={titleId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-heading`}
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(88dvh,720px)] w-full flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-header-bg text-white shadow-2xl shadow-black/70 md:h-[calc(100dvh-2rem)] md:max-h-[760px] md:w-[min(430px,calc(100vw-2rem))] md:rounded-3xl"
          >
            <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
              <span className="grid h-12 w-10 place-items-center rounded-xl border border-primary/30 bg-black/20">
                <AssoMascot variant="judge" size={34} active={!processing} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Asso · arbitro</p>
                <h2 className="text-base font-black" id={`${titleId}-heading`}>Judge della partita</h2>
                <p className="text-[10px] text-white/45">Risposte brevi, con riferimenti verificabili.</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Chiudi Judge"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {judge?.status === 'failed' && (
                <p className="mb-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-100">
                  L’ultima verifica non è andata a buon fine. Puoi fare una nuova domanda.
                </p>
              )}
              {error && (
                <p className="mb-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-[11px] text-amber-100" role="alert">
                  {error}
                </p>
              )}
              <MatchJudgeTranscript
                turns={judge?.turns ?? []}
                acceptedTurn={acceptedTurn}
                userId={userId}
                participantNames={participantNames}
              />
            </div>

            <footer className="shrink-0 border-t border-white/10 bg-black/10 p-3 sm:p-4">
              {matchEnded ? (
                <p className="flex items-center gap-2 text-[11px] leading-relaxed text-white/45">
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  Partita conclusa: questa cronologia è in sola lettura.
                </p>
              ) : processing ? (
                <div className="flex items-center gap-2 rounded-2xl border border-primary/25 bg-primary/10 px-3 py-3 text-xs text-primary-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  <span>Asso sta verificando. Il campo resta bloccato fino alla risposta.</span>
                </div>
              ) : (
                <form onSubmit={submitForm} className="space-y-2">
                  <label htmlFor={`${titleId}-input`} className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                    Chiedi al Judge
                  </label>
                  <textarea
                    ref={inputRef}
                    id={`${titleId}-input`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Es. Posso lanciare questa magia in risposta?"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs leading-relaxed text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] tabular-nums text-white/35">{draft.length}/1000</span>
                    <button
                      type="submit"
                      disabled={!draft.trim() || pending}
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-3.5 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Invia domanda
                    </button>
                  </div>
                </form>
              )}
            </footer>
          </aside>
        </div>
      )}
    </>
  );
}
