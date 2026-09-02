'use client';

import { ChevronRight } from 'lucide-react';
import type { MatchJudgeActivityState } from '@/hooks/use-match-judge-activity';
import { AssoMascot } from './asso-mascot';
import { cn } from '@/lib/utils';

interface MatchJudgeButtonProps {
  open: () => void;
  isOpen: boolean;
  titleId: string;
  fullscreen: boolean;
  layer: string;
  opponentActivity?: MatchJudgeActivityState;
}

export function MatchJudgeButton({
  open,
  isOpen,
  titleId,
  fullscreen,
  layer,
  opponentActivity,
}: MatchJudgeButtonProps) {
  return (
    <button
      type="button"
      onClick={open}
      aria-expanded={isOpen}
      aria-controls={titleId}
      aria-label="Apri la chat del Judge"
      className={cn(
        `fixed ${fullscreen ? 'right-4 top-24' : 'right-4 top-1/2'} ${layer} inline-flex -translate-y-1/2 items-center gap-2 rounded-2xl border bg-header-bg/95 px-2 py-2 text-white shadow-xl shadow-black/40 backdrop-blur-md transition hover:-translate-y-[calc(50%+2px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:right-5`,
        opponentActivity?.isAsking
          ? 'border-primary ring-2 ring-primary/60 shadow-[0_0_30px_rgba(255,115,0,0.65)] animate-pulse'
          : 'border-amber-300/40 hover:border-amber-200/70',
      )}
    >
      {/* Balloon animato di notifica quando Asso o l'avversario stanno scrivendo/pensando */}
      {opponentActivity?.isAsking && !isOpen && (
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 flex -translate-y-1/2 items-center gap-2 rounded-xl border border-primary/50 bg-[#0c1328]/95 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,115,0,0.5)] backdrop-blur-md whitespace-nowrap animate-bounce">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-amber-100">{opponentActivity.label}</span>
          <span className="rounded bg-primary/25 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/40">
            Vedi
          </span>
        </span>
      )}

      <span className="relative grid h-14 w-12 sm:h-16 sm:w-14 place-items-center rounded-2xl bg-black/30 border border-amber-300/20 shadow-inner">
        <AssoMascot variant="judge" size={44} />
        {opponentActivity?.isAsking && (
          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-header-bg bg-primary" />
          </span>
        )}
      </span>
      <span className="hidden pr-2 text-left sm:block">
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-black tracking-wide text-white">Judge Asso</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </span>
        <span className="block text-[10px] font-semibold text-amber-200/80">
          {opponentActivity?.isThinking ? 'Pensa…' : opponentActivity?.isAsking ? 'Attivo' : 'Arbitro TCG'}
        </span>
      </span>
      <ChevronRight className="hidden h-4 w-4 text-white/50 sm:block" aria-hidden />
    </button>
  );
}
