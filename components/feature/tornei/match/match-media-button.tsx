import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchMediaButtonProps {
  on: boolean;
  label: 'camera' | 'microfono' | 'audio avversario';
  onClick?: () => void;
}

export function MatchMediaButton({ on, label, onClick }: MatchMediaButtonProps) {
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
        'grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition active:scale-95',
        on ? 'border-white/20 bg-black/50 hover:bg-black/70 text-white' : 'border-red-400/50 bg-red-500/80 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
