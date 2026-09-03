'use client';

import { useEffect, useRef, type FormEvent } from 'react';
import { CircleHelp, LoaderCircle, X } from 'lucide-react';
import type { MatchJudgeState } from '@/types/tournament';
import type { MatchJudgeController } from '@/hooks/use-match-judge';
import type { MatchJudgeActivityState } from '@/hooks/use-match-judge-activity';
import { MatchJudgeButton } from './match-judge-button';
import { MatchJudgeTranscript } from './match-judge-transcript';
import { cn } from '@/lib/utils';

interface MatchJudgeProps {
  matchId: string;
  userId: string;
  participantNames: Record<string, string>;
  judge?: MatchJudgeState;
  matchEnded: boolean;
  controller: MatchJudgeController;
  fullscreen?: boolean;
  opponentActivity?: MatchJudgeActivityState;
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
  opponentActivity,
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
      <MatchJudgeButton
        open={open}
        isOpen={isOpen}
        titleId={titleId}
        fullscreen={fullscreen}
        layer={layer}
        opponentActivity={opponentActivity}
      />

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
            <header className="shrink-0 border-b border-white/[0.08] bg-white/[0.015] px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2
                      className="text-base font-bold tracking-tight text-white"
                      id={`${titleId}-heading`}
                    >
                      Judge Asso
                    </h2>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[10px] font-semibold',
                        processing ? 'text-amber-200/80' : 'text-emerald-300/80',
                      )}
                    >
                      <span
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          processing ? 'animate-pulse bg-amber-300' : 'bg-emerald-300',
                        )}
                      />
                      {processing ? 'Analisi in corso' : 'Pronto'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/45">
                    Arbitro AI ufficiale del tavolo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Chiudi Judge"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 border-t border-white/[0.07] pt-3" role="note">
                <p className="max-w-[360px] text-[10px] leading-relaxed text-white/40">
                  <span className="font-medium text-white/60">Miglioramento del servizio.</span>{' '}
                  Le chat vengono salvate per migliorare Asso e la qualità delle risposte.
                </p>
              </div>
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
                onSelectPrompt={!draft ? (text) => setDraft(text) : undefined}
              />
              {opponentActivity?.isAsking && !processing && (
                <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs text-primary-foreground animate-pulse">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="font-semibold">{opponentActivity.label}</span>
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-white/10 bg-black/10 p-3 sm:p-4">
              {matchEnded ? (
                <p className="flex items-center gap-2 text-[11px] leading-relaxed text-white/45">
                  <CircleHelp className="h-4 w-4 shrink-0" />
                  Partita conclusa: questa cronologia è in sola lettura.
                </p>
              ) : processing ? (
                <div className="flex items-center gap-2.5 rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-3 text-xs text-primary-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary shrink-0" />
                  <span>Asso sta verificando. Il campo resta bloccato fino alla risposta.</span>
                </div>
              ) : (
                <form onSubmit={submitForm} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`${titleId}-input`} className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                      Domanda sulle regole
                    </label>
                    <span className={cn('text-[10px] tabular-nums', draft.length > 800 ? 'text-amber-300 font-bold' : 'text-white/40')}>
                      {draft.length}/1000 caratteri
                    </span>
                  </div>
                  <textarea
                    ref={inputRef}
                    id={`${titleId}-input`}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Descrivi l’interazione tra le carte (consigliate 2-3 frasi chiare)…"
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-xs leading-relaxed text-white placeholder:text-white/35 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <p className="text-[10px] text-white/40">
                      {draft.length > 800 ? '⚠️ Domanda lunga: mantienila concisa' : '💡 Risposte con riferimenti ufficiali'}
                    </p>
                    <button
                      type="submit"
                      disabled={!draft.trim() || pending}
                      className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-500 px-4 text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Invia
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
