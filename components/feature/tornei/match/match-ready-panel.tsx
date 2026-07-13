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
    <section className="mb-4 rounded-2xl border border-primary/40 bg-primary/[0.08] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Swords className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-white">Conferma disponibilita</p>
          <p className="text-xs text-white/55">La partita parte solo dopo la conferma di entrambi.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReadyConfirmation
          username={local.username}
          ready={myReady}
          isMe
          pending={pending}
          onReady={onReady}
        />
        <ReadyConfirmation username={remote.username} ready={opponentReady} />
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
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
    </section>
  );
}

function ReadyConfirmation({
  username,
  ready,
  isMe = false,
  pending = false,
  onReady,
}: {
  username: string;
  ready: boolean;
  isMe?: boolean;
  pending?: boolean;
  onReady?: () => void;
}) {
  return (
    <article
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
        ready ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/10 bg-white/[0.04]',
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{username}</p>
        <p className={cn('mt-0.5 text-[10px] font-black uppercase tracking-wider', ready ? 'text-emerald-300' : 'text-white/45')}>
          {ready ? 'Confermato' : isMe ? 'In attesa della tua conferma' : 'In attesa della conferma'}
        </p>
      </div>
      {isMe ? (
        <button
          type="button"
          disabled={pending}
          onClick={onReady}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-50',
            ready
              ? 'border border-white/20 bg-white/10 hover:bg-white/15'
              : 'ready-pulse bg-gradient-to-r from-primary to-orange-500 hover:opacity-90',
          )}
        >
          {ready ? <Hourglass className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {ready ? 'Annulla' : 'Pronto'}
        </button>
      ) : ready ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
      ) : (
        <Hourglass className="h-5 w-5 shrink-0 text-white/35" />
      )}
    </article>
  );
}
