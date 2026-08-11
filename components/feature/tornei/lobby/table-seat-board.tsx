import { Clock3 } from 'lucide-react';
import { LobbySeat, VersusBadge } from './lobby-seat';

interface TableSeatBoardProps {
  myUsername: string;
  opponentUsername?: string | null;
  eyebrow?: string;
}

export function TableSeatBoard({
  myUsername,
  opponentUsername,
  eyebrow = 'STATO POSTI',
}: TableSeatBoardProps) {
  return (
    <section aria-labelledby="seat-table-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h3 id="seat-table-heading" className="mt-0.5 text-base font-black text-header-bg sm:text-lg">
            Controlla i posti
          </h3>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-600">
          Heads-up 1v1
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 shadow-sm sm:p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <LobbySeat
            occupied
            username={myUsername}
            label="Tu"
            isMe
            compact
            light
          />
          <VersusBadge light compact />
          <LobbySeat
            occupied={Boolean(opponentUsername)}
            username={opponentUsername}
            label="Rivale"
            compact
            light
          />
        </div>

        {!opponentUsername && (
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-200/80 pt-3 text-center text-xs font-semibold text-slate-500">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            Il tavolo resta aperto mentre aspetti un avversario.
          </div>
        )}
      </div>
    </section>
  );
}
