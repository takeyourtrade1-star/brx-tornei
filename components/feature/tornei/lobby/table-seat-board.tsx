import { User, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
      <h3 id="seat-table-heading" className="mt-1 text-base font-black text-white">
        Controlla il tavolo
      </h3>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
        <TableSide occupied username={myUsername} label="Tu" highlight />
        <div className="flex items-center justify-center">
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black uppercase tracking-wider text-white/65">
            vs
          </span>
        </div>
        {opponentUsername ? (
          <TableSide occupied username={opponentUsername} label="Avversario" />
        ) : (
          <TableSide occupied={false} username="" label="Posto libero" />
        )}
      </div>
      {!opponentUsername && (
        <p className="mt-2 text-center text-sm font-medium text-white/50">
          Il tavolo resterà visibile mentre aspetti un avversario.
        </p>
      )}
    </section>
  );
}

function TableSide({
  occupied,
  username,
  label,
  highlight = false,
}: {
  occupied: boolean;
  username: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 text-center',
        occupied
          ? highlight
            ? 'border-primary/50 bg-primary/10'
            : 'border-white/15 bg-white/[0.05]'
          : 'border-dashed border-white/15 bg-white/[0.02]',
      )}
    >
      <span className={cn(
        'grid h-10 w-10 place-items-center rounded-full',
        occupied ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30',
      )}>
        {occupied ? <User className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
      </span>
      <span className="max-w-full truncate text-sm font-bold text-white">
        {occupied ? username : '—'}
      </span>
      <span className="text-xs font-bold text-white/40">{label}</span>
    </div>
  );
}
