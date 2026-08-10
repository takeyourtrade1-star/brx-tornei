import { Signal } from 'lucide-react';
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
  const tone = connection?.level;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider',
        tone === 'good' && 'border-emerald-400/30 bg-emerald-500/10 text-emerald-500',
        tone === 'fair' && 'border-amber-400/30 bg-amber-500/10 text-amber-500',
        tone === 'poor' && 'border-red-400/30 bg-red-500/10 text-red-500',
        !tone && (dark ? 'border-white/10 bg-white/5 text-white/45' : 'border-slate-900/10 bg-slate-50 text-slate-400'),
      )}
      title="Controllo diagnostico: non assegna automaticamente l'esito"
    >
      <Signal className="h-3 w-3" aria-hidden />
      <span className={compact ? 'hidden sm:inline' : undefined}>
        {connectionQualityLabel(connection)}
      </span>
    </span>
  );
}
