import { getMockParticipantDetails } from './tournament-mock-details';
import type { Participant } from '@/types/tournament';

interface TournamentParticipantChipProps {
  participant: Participant;
  format: string;
}

export function TournamentParticipantChip({ participant, format }: TournamentParticipantChipProps) {
  const { country, deck } = getMockParticipantDetails(participant.username, format);

  return (
    <li className="group relative flex items-center rounded-full bg-white/8 px-2 py-0.5 ring-1 ring-white/10">
      <span className="text-xs font-semibold text-white/85">{participant.username}</span>
      <div className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-44 -translate-x-1/2 group-hover:block">
        <div className="rounded-2xl border border-white/15 bg-slate-950/95 p-2.5 text-left shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
            <span className="truncate text-xs font-bold">{participant.username}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`}
              alt={country.code}
              className="h-2.5 w-3.5 rounded-sm border border-white/10 object-cover"
            />
          </div>
          <p className="mt-1 text-[10px] text-white/55">{country.name}</p>
          <p className="mt-1 truncate text-xs font-bold text-marquee">{deck}</p>
        </div>
      </div>
    </li>
  );
}
