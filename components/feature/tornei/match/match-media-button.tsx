import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchMediaButtonProps {
  on: boolean;
  label: 'camera' | 'microfono';
  onClick: () => void;
}

export function MatchMediaButton({ on, label, onClick }: MatchMediaButtonProps) {
  const Icon = label === 'camera' ? (on ? Video : VideoOff) : on ? Mic : MicOff;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={(on ? 'Spegni ' : 'Accendi ') + label}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition',
        on ? 'border-white/20 bg-black/50 hover:bg-black/70' : 'border-red-400/50 bg-red-500/80',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
