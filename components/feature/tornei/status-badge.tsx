import { cn } from '@/lib/utils';
import type { TournamentStatus } from '@/types/tournament';
import { CheckCircle2, Clock } from 'lucide-react';

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
    chip: 'bg-red-500/15 text-red-300 ring-red-400/30',
    dot: 'bg-red-400 animate-pulse',
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
      {status === 'in_registrazione' ? (
        <Clock className="h-3.5 w-3.5 text-marquee animate-pulse shrink-0" aria-hidden />
      ) : status === 'terminata' ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-white/60 shrink-0" aria-hidden />
      ) : (
        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      )}
      {label}
    </span>
  );
}
