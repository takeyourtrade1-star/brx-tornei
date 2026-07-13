import { CheckCircle2, Heart, Hourglass, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { STARTING_LIFE_OPTIONS } from '@/lib/match-life-protocol';
import { cn } from '@/lib/utils';

interface MatchReadyPanelProps {
  local: Participant;
  remote: Participant;
  myReady: boolean;
  opponentReady: boolean;
  pending: boolean;
  startingLife: number;
  lifeConnected: boolean;
  canSetStartingLife: boolean;
  onStartingLifeChange: (value: number) => void;
  onReady: () => void;
}

export function MatchReadyPanel({
  local,
  remote,
  myReady,
  opponentReady,
  pending,
  startingLife,
  lifeConnected,
  canSetStartingLife,
  onStartingLifeChange,
  onReady,
}: MatchReadyPanelProps) {
  return (
    <div className="mb-4 grid gap-4 rounded-2xl border border-primary/40 bg-primary/[0.08] px-4 py-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
      <div className="flex flex-wrap items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <ReadyChip username={local.username} ready={myReady} isMe />
        <span className="text-[10px] font-black uppercase tracking-wider text-white/40">vs</span>
        <ReadyChip username={remote.username} ready={opponentReady} />
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        <div className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-white/55">
          <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
          Vita iniziale condivisa
        </div>
        <div className="flex justify-center gap-1.5" aria-label="Scegli i punti vita iniziali">
          {STARTING_LIFE_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              disabled={!lifeConnected || !canSetStartingLife}
              aria-pressed={startingLife === value}
              onClick={() => onStartingLifeChange(value)}
              className={cn(
                'h-8 min-w-11 rounded-lg border px-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40',
                startingLife === value
                  ? 'border-primary bg-primary text-white shadow-[0_0_18px_rgba(255,115,0,0.25)]'
                  : 'border-white/10 bg-white/5 text-white/65 hover:border-primary/40 hover:text-white',
              )}
            >
              {value}
            </button>
          ))}
        </div>
        {!canSetStartingLife && (
          <p className="mt-1.5 text-center text-[9px] font-semibold text-white/40">
            La imposta chi ha creato il tavolo
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {myReady && !opponentReady && (
          <span className="text-xs font-semibold text-white/60">In attesa dell’avversario…</span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={onReady}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-50',
            myReady
              ? 'border border-white/20 bg-white/10 hover:bg-white/15'
              : 'ready-pulse bg-gradient-to-r from-primary to-orange-500 hover:opacity-90',
          )}
        >
          {myReady ? <Hourglass className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {myReady ? 'Annulla pronto' : 'Pronto!'}
        </button>
      </div>
    </div>
  );
}

function ReadyChip({ username, ready, isMe = false }: { username: string; ready: boolean; isMe?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold',
        ready ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70',
      )}
    >
      {ready ? <CheckCircle2 className="h-4 w-4" /> : <Hourglass className="h-4 w-4" />}
      {username}
      {isMe && <span className="text-[10px] uppercase tracking-wider opacity-70">tu</span>}
    </span>
  );
}
