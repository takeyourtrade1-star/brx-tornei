import { Clock } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/matches/format-datetime';
import type { MatchEvent, MatchEventType } from '@/types/match';

const EVENT_ICON: Record<MatchEventType, string> = {
  partita_iniziata: '🎮',
  punto_segnato: '●',
  game_vinto: '🏆',
  partita_finita: '🏁',
  chiamata_giudice: '⚖️',
};

interface MatchTimelineProps {
  events: MatchEvent[];
}

/** Timeline eventi partita ordinata dal più recente. */
export function MatchTimeline({ events }: MatchTimelineProps) {
  return (
    <section className="brx-glass rounded-2xl border border-white/15 p-5">
      <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-marquee">
        <Clock className="h-4 w-4" />
        Timeline eventi
      </h2>

      {events.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">Nessun evento registrato.</p>
      ) : (
        <ol className="relative mt-4 space-y-0 border-l border-white/15 pl-4">
          {events.map((event, index) => (
            <li key={event.id} className="relative pb-4 last:pb-0">
              <span
                className="absolute -left-[1.35rem] flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px]"
                aria-hidden
              >
                {EVENT_ICON[event.type]}
              </span>
              <div className={index === 0 ? '' : 'pt-0'}>
                <time className="text-xs text-white/45">{formatMatchDateTime(event.timestamp)}</time>
                <p className="mt-0.5 text-sm font-medium text-white/90">{event.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
