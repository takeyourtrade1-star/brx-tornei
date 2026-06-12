import { cn } from '@/lib/utils';
import type { MatchResult } from '@/types/match';

const RESULT_CONFIG: Record<MatchResult, { label: string; chip: string }> = {
  vittoria: {
    label: 'Vittoria',
    chip: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  },
  sconfitta: {
    label: 'Sconfitta',
    chip: 'bg-red-500/15 text-red-300 ring-red-400/30',
  },
  pareggio: {
    label: 'Pareggio',
    chip: 'bg-white/10 text-white/70 ring-white/15',
  },
};

export function MatchResultBadge({ result }: { result: MatchResult }) {
  const { label, chip } = RESULT_CONFIG[result];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1',
        chip
      )}
    >
      {label}
    </span>
  );
}
