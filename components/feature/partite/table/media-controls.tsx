'use client';

import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaControlsProps {
  micEnabled: boolean;
  onToggleMic: () => void;
  connectionQuality: 'connecting' | 'good' | 'excellent';
  opponentConnected: boolean;
}

const SIGNAL_LABEL = {
  connecting: 'Connessione…',
  good: 'Segnale buono',
  excellent: 'Segnale ottimo',
} as const;

/** Indicatori microfono e segnale — toggle mic locale. */
export function MediaControls({
  micEnabled,
  onToggleMic,
  connectionQuality,
  opponentConnected,
}: MediaControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onToggleMic}
        aria-label={micEnabled ? 'Disattiva microfono' : 'Attiva microfono'}
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors',
          micEnabled
            ? 'bg-white/15 text-white hover:bg-white/25'
            : 'bg-destructive/80 text-white hover:bg-destructive'
        )}
      >
        {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
        {micEnabled ? 'Mic on' : 'Mic off'}
      </button>

      <span
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
          opponentConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            connectionQuality === 'connecting' && 'animate-pulse bg-marquee',
            connectionQuality === 'good' && 'bg-emerald-400',
            connectionQuality === 'excellent' && 'bg-emerald-300'
          )}
          aria-hidden
        />
        {opponentConnected ? SIGNAL_LABEL[connectionQuality] : 'Avversario in attesa'}
      </span>
    </div>
  );
}
