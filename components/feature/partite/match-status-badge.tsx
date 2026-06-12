import { cn } from '@/lib/utils';
import type { ActiveMatchPhase, MatchStatus } from '@/types/match';
import { CheckCircle2, Clock, Swords } from 'lucide-react';

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; chip: string; icon: 'swords' | 'check' | 'clock' }
> = {
  attiva: {
    label: 'Attiva',
    chip: 'bg-red-500/15 text-red-300 ring-red-400/30',
    icon: 'swords',
  },
  completata: {
    label: 'Completata',
    chip: 'bg-white/10 text-white/60 ring-white/15',
    icon: 'check',
  },
  in_attesa: {
    label: 'In attesa',
    chip: 'bg-marquee/15 text-marquee ring-marquee/30',
    icon: 'clock',
  },
};

const ACTIVE_PHASE_CONFIG: Record<
  ActiveMatchPhase,
  { label: string; chip: string; icon: 'swords' | 'clock' }
> = {
  in_corso: {
    label: 'In corso',
    chip: 'bg-red-500/15 text-red-300 ring-red-400/30',
    icon: 'swords',
  },
  programmata: {
    label: 'Programmata',
    chip: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
    icon: 'clock',
  },
};

export function MatchStatusBadge({
  status,
  activePhase,
}: {
  status: MatchStatus;
  activePhase?: ActiveMatchPhase;
}) {
  const config =
    status === 'attiva' && activePhase
      ? ACTIVE_PHASE_CONFIG[activePhase]
      : STATUS_CONFIG[status];
  const { label, chip, icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1',
        chip
      )}
    >
      {icon === 'swords' && <Swords className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {icon === 'check' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {icon === 'clock' && <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden />}
      {label}
    </span>
  );
}
