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
          <h3 id="seat-table-heading" className="mt-1 text-lg font-black text-white">
            Controlla i posti
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white/55">
          Heads-up
        </span>
      </div>

      <div className="mt-3 rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-3 shadow-inner shadow-card2-end/30 sm:p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <LobbySeat
            occupied
            username={myUsername}
            label="Tu"
            isMe
            compact
          />
          <VersusBadge />
          <LobbySeat
            occupied={Boolean(opponentUsername)}
            username={opponentUsername}
            label="Rivale"
            compact
          />
        </div>

        {!opponentUsername && (
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/10 pt-3 text-center text-xs font-semibold text-white/55">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            Il tavolo resta aperto mentre aspetti un avversario.
          </div>
        )}
      </div>
    </section>
  );
}
