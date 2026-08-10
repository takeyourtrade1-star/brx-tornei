import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConnectionQuality } from '@/types/tournament';
import { ConnectionQualityBadge } from '../connection-quality-badge';

export function CornerMarks({ tone }: { tone: string }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-3">
      <span className={cn('absolute left-0 top-0 h-4 w-4 rounded-tl-md border-l-2 border-t-2', tone)} />
      <span className={cn('absolute right-0 top-0 h-4 w-4 rounded-tr-md border-r-2 border-t-2', tone)} />
      <span className={cn('absolute bottom-0 left-0 h-4 w-4 rounded-bl-md border-b-2 border-l-2', tone)} />
      <span className={cn('absolute bottom-0 right-0 h-4 w-4 rounded-br-md border-b-2 border-r-2', tone)} />
    </span>
  );
}

export function AcceptPlayerChip({
  label,
  ready,
  pending = false,
  connection,
}: {
  label: string;
  ready: boolean;
  pending?: boolean;
  connection?: ConnectionQuality;
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors',
        ready ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/10 bg-white/[0.05]',
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {ready ? (
          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-label="Ha accettato" />
        ) : (
          <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full bg-white/35', pending && 'animate-pulse bg-primary')} aria-hidden />
        )}
        <span className="truncate text-[13px] font-black text-white">{label}</span>
      </span>
      <ConnectionQualityBadge connection={connection} dark />
    </div>
  );
}
