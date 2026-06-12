import { cn } from '@/lib/utils';
import type { DeckStatus } from '@/types/deck';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const STATUS_CONFIG: Record<
  DeckStatus,
  { label: string; chip: string; icon: 'check' | 'clock' | 'alert' }
> = {
  valido: {
    label: 'Valido',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
    icon: 'check',
  },
  in_revisione: {
    label: 'In revisione',
    chip: 'bg-marquee/15 text-marquee ring-marquee/30',
    icon: 'clock',
  },
  non_valido: {
    label: 'Non valido',
    chip: 'bg-red-500/15 text-red-300 ring-red-400/30',
    icon: 'alert',
  },
};

export function DeckStatusBadge({ status }: { status: DeckStatus }) {
  const { label, chip, icon } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1',
        chip
      )}
    >
      {icon === 'check' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {icon === 'clock' && <Clock className="h-3.5 w-3.5 shrink-0 animate-pulse" aria-hidden />}
      {icon === 'alert' && <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {label}
    </span>
  );
}
