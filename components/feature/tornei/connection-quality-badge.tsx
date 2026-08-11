import { connectionQualityLabel } from '@/lib/webrtc/connection-quality';
import { cn } from '@/lib/utils';
import type { ConnectionQuality } from '@/types/tournament';

export function ConnectionQualityBadge({
  connection,
  dark = false,
  compact = false,
}: {
  connection?: ConnectionQuality;
  dark?: boolean;
  compact?: boolean;
}) {
  const level = connection?.level;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide',
        !dark &&
          (level === 'good'
            ? 'border-emerald-400/30 bg-emerald-500/[0.08] text-emerald-600'
            : level === 'fair'
              ? 'border-amber-400/30 bg-amber-500/[0.08] text-amber-600'
              : level === 'poor'
                ? 'border-rose-400/30 bg-rose-500/[0.08] text-rose-600'
                : 'border-slate-900/10 bg-slate-50 text-slate-400'),
        dark &&
          (level === 'good'
            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
            : level === 'fair'
              ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
              : level === 'poor'
                ? 'border-rose-400/30 bg-rose-400/10 text-rose-300'
                : 'border-white/10 bg-white/5 text-white/45'),
      )}
      title="Stato della connessione"
    >
      <ConnectionIcon level={level} />
      {!compact && <span>{connectionQualityLabel(connection)}</span>}
    </span>
  );
}

function ConnectionIcon({ level }: { level?: ConnectionQuality['level'] }) {
  const filled =
    level === 'good' ? 3 : level === 'fair' ? 2 : level === 'poor' ? 1 : 0;
  const tone =
    level === 'good'
      ? 'text-emerald-500'
      : level === 'fair'
        ? 'text-amber-500'
        : level === 'poor'
          ? 'text-rose-500'
          : 'text-slate-300';
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-3.5 w-3.5', tone)}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 8.5a15 15 0 0 1 18 0" opacity={filled >= 1 ? 1 : 0.28} />
      <path d="M5.5 12a10 10 0 0 1 13 0" opacity={filled >= 2 ? 1 : 0.28} />
      <path d="M8 15.5a5 5 0 0 1 8 0" opacity={filled >= 3 ? 1 : 0.28} />
      <circle cx="12" cy="19" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
