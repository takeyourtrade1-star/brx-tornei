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
  eyebrow = 'Passaggio 2',
}: TableSeatBoardProps) {
  return (
    <section aria-labelledby="seat-table-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
          <h3 id="seat-table-heading" className="mt-1 text-lg font-black text-header-bg">
            Controlla i posti
          </h3>
        </div>
        <span className="rounded-full border border-slate-900/[0.08] bg-slate-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
          Heads-up
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-900/[0.08] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <LobbySeat
            occupied
            username={myUsername}
            label="Tu"
            isMe
            compact
            light
          />
          <VersusBadge light />
          <LobbySeat
            occupied={Boolean(opponentUsername)}
            username={opponentUsername}
            label="Rivale"
            compact
            light
          />
        </div>

        {!opponentUsername && (
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-900/[0.06] pt-3 text-center text-xs font-semibold text-slate-500">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            Il tavolo resta aperto mentre aspetti un avversario.
          </div>
        )}
      </div>
    </section>
  );
}
