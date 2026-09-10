import { BellOff } from 'lucide-react';

interface SocialDndReminderProps {
  active: boolean;
  minutesRemaining: number;
}

/** Richiamo ancorato al comando Amici, visibile mentre il DND è attivo. */
export function SocialDndReminder({ active, minutesRemaining }: SocialDndReminderProps) {
  if (!active) return null;

  const minuteLabel = minutesRemaining === 1 ? '1 minuto' : `${minutesRemaining} minuti`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none absolute bottom-full right-0 z-20 mb-3 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-amber-300/30 bg-slate-950/95 px-3 py-2.5 text-left text-white shadow-2xl shadow-black/40 backdrop-blur-md md:bottom-auto md:right-full md:top-1/2 md:mr-3 md:mb-0 md:-translate-y-1/2"
    >
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 right-5 h-3 w-3 rotate-45 border-b border-r border-amber-300/30 bg-slate-950 md:-right-1.5 md:bottom-auto md:top-1/2 md:border-b-0 md:border-l-0 md:border-r md:border-t md:-translate-y-1/2"
      />
      <div className="relative flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl border border-amber-300/25 bg-amber-300/10 text-amber-300">
          <BellOff className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-200">
            Non disturbare attivo
          </p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-white/60">
            Inviti sospesi · {minuteLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
