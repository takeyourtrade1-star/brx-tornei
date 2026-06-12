import { cn } from '@/lib/utils';

interface RegistrationMeterProps {
  current: number;
  max: number;
  className?: string;
}

/** Barra di riempimento posti torneo (registrati / max). */
export function RegistrationMeter({ current, max, className }: RegistrationMeterProps) {
  const ratio = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  const isFull = current >= max;

  return (
    <div className={cn('space-y-1', className)}>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${current} su ${max} posti occupati`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isFull ? 'bg-primary' : 'bg-marquee'
          )}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}
