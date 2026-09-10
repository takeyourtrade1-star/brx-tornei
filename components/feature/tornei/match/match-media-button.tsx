import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchMediaButtonProps {
  on: boolean;
  label: 'camera' | 'microfono' | 'audio avversario';
  onClick?: () => void;
  className?: string;
}

export function MatchMediaButton({ on, label, onClick, className }: MatchMediaButtonProps) {
  const Icon =
    label === 'camera'
      ? on
        ? Video
        : VideoOff
      : label === 'microfono'
        ? on
          ? Mic
          : MicOff
        : on
          ? Volume2
          : VolumeX;

  const ariaLabel =
    label === 'audio avversario'
      ? (on ? 'Silenzia ' : 'Riattiva ') + label
      : (on ? 'Spegni ' : 'Accendi ') + label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-md transition active:scale-95 shadow-sm',
        on
          ? 'border-white/15 bg-white/[0.08] text-white hover:border-white/30 hover:bg-white/15'
          : 'border-red-400/50 bg-gradient-to-b from-red-500 to-red-600 text-white hover:brightness-110 shadow-[0_2px_8px_rgba(239,68,68,0.4)]',
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
