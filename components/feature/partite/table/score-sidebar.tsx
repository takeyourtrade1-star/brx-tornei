'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Gavel,
  Plus,
  Trophy,
} from 'lucide-react';
import {
  finishMatchAction,
  recordGameWinAction,
  recordPointAction,
  requestJudgeCallAction,
} from '@/actions/matches';
import { Badge } from '@/components/ui/badge';
import { gamesToWin } from '@/lib/matches/best-of';
import { cn } from '@/lib/utils';
import type { MatchDetail, MatchPlayerSide } from '@/types/match';

interface ScoreSidebarProps {
  match: MatchDetail;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

function ScoreRow({
  label,
  games,
  points,
  onAddPoint,
  onWinGame,
  disabled,
}: {
  label: string;
  games: number;
  points: number;
  onAddPoint: () => void;
  onWinGame: () => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-white">{label}</span>
        <span className="shrink-0 text-xs text-white/50">
          Game: <span className="font-bold tabular-nums text-white">{games}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xl font-black tabular-nums text-marquee">{points}</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={onAddPoint}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-40"
            aria-label={`Punto per ${label}`}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onWinGame}
            className="flex items-center gap-1 rounded-lg bg-primary/80 px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-primary disabled:opacity-40"
          >
            <Trophy className="h-3.5 w-3.5" />
            Game
          </button>
        </div>
      </div>
    </div>
  );
}

/** Pannello punteggio collassabile — segnare punti, game e fine partita. */
export function ScoreSidebar({ match, collapsed, onToggleCollapse, className }: ScoreSidebarProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { scoreState } = match;
  const needed = gamesToWin(match.bestOf);
  const disabled = scoreState.isFinished || isPending;

  function runAction(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handlePoint(player: MatchPlayerSide) {
    runAction(() => recordPointAction(match.id, player));
  }

  function handleGameWin(winner: MatchPlayerSide) {
    runAction(() => recordGameWinAction(match.id, winner));
  }

  function handleFinish(winner: MatchPlayerSide) {
    if (!window.confirm(`Confermi la chiusura della partita a favore di ${winner === 'self' ? 'te' : match.opponent}?`)) {
      return;
    }
    runAction(() => finishMatchAction(match.id, winner));
  }

  function handleJudgeCall() {
    setToast('Chiamata al giudice — presto in arrivo.');
    void requestJudgeCallAction(match.id);
    window.setTimeout(() => setToast(null), 3000);
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggleCollapse}
        className={cn(
          'brx-glass flex h-full w-10 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 py-4',
          className
        )}
        aria-label="Espandi pannello punteggio"
      >
        <ChevronLeft className="h-5 w-5 text-white/70" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 [writing-mode:vertical-rl]">
          Punteggio
        </span>
      </button>
    );
  }

  return (
    <aside
      className={cn(
        'brx-glass flex h-full w-full max-w-sm shrink-0 flex-col gap-4 rounded-2xl border border-white/15 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-marquee">
            Punteggio
          </h2>
          <p className="text-xs text-white/50">
            {match.bestOf} · primo a {needed} game
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Comprimi pannello"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl bg-white/[0.06] px-3 py-2 text-center">
        <p className="text-xs uppercase tracking-wider text-white/45">Match</p>
        <p className="text-3xl font-black tabular-nums text-white">
          {scoreState.selfGames}
          <span className="mx-2 text-white/30">—</span>
          {scoreState.opponentGames}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <ScoreRow
          label="Tu"
          games={scoreState.selfGames}
          points={scoreState.currentGameSelfPoints}
          onAddPoint={() => handlePoint('self')}
          onWinGame={() => handleGameWin('self')}
          disabled={disabled}
        />
        <ScoreRow
          label={match.opponent}
          games={scoreState.opponentGames}
          points={scoreState.currentGameOpponentPoints}
          onAddPoint={() => handlePoint('opponent')}
          onWinGame={() => handleGameWin('opponent')}
          disabled={disabled}
        />
      </div>

      {!scoreState.isFinished && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-3">
          <p className="text-xs font-bold uppercase tracking-wider text-white/45">Fine partita</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFinish('self')}
              className="rounded-lg bg-emerald-500/20 px-2 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:opacity-40"
            >
              Vittoria tua
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => handleFinish('opponent')}
              className="rounded-lg bg-white/10 px-2 py-2 text-xs font-bold text-white/80 transition-colors hover:bg-white/15 disabled:opacity-40"
            >
              Vittoria avversario
            </button>
          </div>
        </div>
      )}

      {scoreState.isFinished && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-center text-sm font-bold text-emerald-300">
          Partita conclusa
        </p>
      )}

      <button
        type="button"
        onClick={handleJudgeCall}
        disabled
        className="relative flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-sm font-semibold text-white/40"
      >
        <Gavel className="h-4 w-4" />
        Chiama il giudice
        <Badge variant="warning" className="absolute -right-1 -top-2 text-[10px]">
          Presto
        </Badge>
      </button>

      {(error || toast) && (
        <p className={cn('text-xs', error ? 'text-red-300' : 'text-marquee')}>{error ?? toast}</p>
      )}
    </aside>
  );
}
