import { CheckCircle2, Hourglass, Swords } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchReadyPanelProps {
  local: Participant;
  remote: Participant;
  myReady: boolean;
  opponentReady: boolean;
  pending: boolean;
  onReady: () => void;
}

export function MatchReadyPanel({
  local,
  remote,
  myReady,
  opponentReady,
  pending,
  onReady,
}: MatchReadyPanelProps) {
  return (
    <div className="mb-4 flex flex-col items-center gap-3 rounded-2xl border border-primary/40 bg-primary/[0.08] px-4 py-4 sm:flex-row sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <ReadyChip username={local.username} ready={myReady} isMe />
        <span className="text-[10px] font-black uppercase tracking-wider text-white/40">vs</span>
        <ReadyChip username={remote.username} ready={opponentReady} />
      </div>
      <div className="flex items-center gap-3">
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
