import { cn } from '@/lib/utils';
import type { TournamentStatus } from '@/types/tournament';
import { CheckCircle2, Clock, Radio } from 'lucide-react';

const STATUS_CONFIG: Record<
  TournamentStatus,
  { label: string; chip: string; icon?: 'clock' | 'live' | 'done' }
> = {
  in_registrazione: {
    label: 'In registrazione',
    chip: 'bg-marquee/20 text-marquee ring-marquee/40 shadow-[0_0_12px_rgba(255,200,0,0.15)]',
    icon: 'clock',
  },
  iniziata: {
    label: 'In corso',
    chip: 'bg-red-500/20 text-red-200 ring-red-400/45 shadow-[0_0_14px_rgba(248,113,113,0.2)]',
    icon: 'live',
  },
  terminata: {
    label: 'Terminata',
    chip: 'bg-white/8 text-white/55 ring-white/15',
    icon: 'done',
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TournamentStatus;
  className?: string;
}) {
  const { label, chip, icon } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 sm:text-xs',
        chip,
        className
      )}
    >
      {icon === 'clock' && (
        <Clock className="h-3.5 w-3.5 shrink-0 text-marquee animate-pulse" aria-hidden />
      )}
      {icon === 'live' && (
        <Radio className="h-3.5 w-3.5 shrink-0 text-red-300 animate-pulse" aria-hidden />
      )}
      {icon === 'done' && (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-white/50" aria-hidden />
      )}
      {label}
    </span>
  );
}
