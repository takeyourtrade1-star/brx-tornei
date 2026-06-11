import { cn } from '@/lib/utils';
import type { TournamentStatus } from '@/types/tournament';

const STATUS_CONFIG: Record<
  TournamentStatus,
  { label: string; chip: string; dot: string }
> = {
  in_registrazione: {
    label: 'In Registrazione',
    chip: 'bg-marquee/15 text-marquee ring-marquee/30',
    dot: 'bg-marquee animate-pulse',
  },
  iniziata: {
    label: 'Iniziata',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
    dot: 'bg-emerald-400 animate-pulse',
  },
  terminata: {
    label: 'Terminata',
    chip: 'bg-white/10 text-white/60 ring-white/15',
    dot: 'bg-white/40',
  },
};

export function StatusBadge({ status }: { status: TournamentStatus }) {
  const { label, chip, dot } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1',
        chip
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      {label}
    </span>
  );
}
