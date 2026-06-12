import { getMockParticipantDetails } from '@/lib/tournaments/display';
import type { Participant } from '@/types/tournament';

interface ParticipantChipProps {
  participant: Participant;
  format: string;
  /** Su mobile i tooltip hover non sono utili — chip semplificato. */
  compact?: boolean;
}

/** Chip partecipante con tooltip dettagli (desktop). */
export function ParticipantChip({ participant, format, compact }: ParticipantChipProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
        {participant.username}
      </span>
    );
  }

  const { country, deck } = getMockParticipantDetails(participant.username, format);

  return (
    <span className="group relative inline-flex cursor-help items-center rounded-full bg-white/10 px-2.5 py-1 ring-1 ring-white/15">
      <span className="text-xs font-semibold text-white/90">{participant.username}</span>

      <span className="absolute bottom-full left-1/2 z-30 mb-2.5 hidden w-48 -translate-x-1/2 group-hover:block">
        <span className="animate-auth-enter block">
          <span className="block rounded-2xl border border-white/20 bg-slate-950/95 p-3 text-left shadow-2xl backdrop-blur-md">
            <span className="flex flex-col gap-1.5 font-sans">
              <span className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="max-w-[100px] truncate text-xs font-bold text-white">
                  {participant.username}
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
                    alt={country.code}
                    className="h-2.5 w-3.5 shrink-0 rounded-sm border border-white/10 object-cover"
                  />
                  {country.code}
                </span>
              </span>
              <span className="text-[10px] text-white/70">
                <span className="flex items-center justify-between">
                  <span>Paese:</span>
                  <span className="font-semibold text-white">{country.name}</span>
                </span>
                <span className="mt-0.5 flex items-center justify-between">
                  <span>Stato:</span>
                  <span className="font-bold text-emerald-400">Online</span>
                </span>
                <span className="mt-1.5 block border-t border-white/5 pt-1">
                  <span className="block text-[9px] uppercase tracking-wider text-white/50">
                    Mazzo in uso
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-bold text-marquee">{deck}</span>
                </span>
              </span>
            </span>
          </span>
          <span className="mx-auto -mt-1.5 block h-2.5 w-2.5 rotate-45 border-b border-r border-white/20 bg-slate-950/95" />
        </span>
      </span>
    </span>
  );
}
