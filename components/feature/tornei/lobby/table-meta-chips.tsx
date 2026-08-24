import { Coins, Swords, Users } from 'lucide-react';
import type { BestOf } from '@/types/tournament';

export function TableMetaChips({
  seatedCount,
  bestOf,
  price,
}: {
  seatedCount: number;
  bestOf: BestOf;
  price: string;
}) {
  return (
    <div className="ml-auto flex flex-wrap items-center gap-2 text-[11px] font-bold">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-white/85">
        <Users className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden />
        <span>{seatedCount}/2</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-white/85">
        <Swords className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden />
        <span>{bestOf}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 uppercase text-white/85">
        <Coins className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
        <span>{price}</span>
      </span>
    </div>
  );
}
