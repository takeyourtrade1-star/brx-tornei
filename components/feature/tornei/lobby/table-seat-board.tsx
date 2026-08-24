import { Clock3 } from 'lucide-react';
import { TableStage } from './table-stage';

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
          <h3 id="seat-table-heading" className="mt-0.5 text-base font-black text-white sm:text-lg">
            Controlla i posti
          </h3>
        </div>
        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white/70">
          Heads-up 1v1
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 sm:p-4">
        <TableStage
          far={{
            occupied: Boolean(opponentUsername),
            username: opponentUsername,
            label: 'Rivale',
          }}
          near={{
            occupied: true,
            username: myUsername,
            isMe: true,
            label: 'Tu',
          }}
          tone={opponentUsername ? 'mine' : 'empty'}
        />

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
