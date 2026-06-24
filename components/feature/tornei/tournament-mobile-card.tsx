import { Eye, Lock } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import { StatusBadge } from './status-badge';
import { MobileJoinButton } from './mobile-join-button';
import { BEST_OF_LABEL, getMockParticipantDetails } from './tournament-mock-details';
import type { Tournament } from '@/types/tournament';

interface TournamentMobileCardProps {
  tournament: Tournament;
}

export function TournamentMobileCard({ tournament }: TournamentMobileCardProps) {
  const joinedCount = tournament.participants.length;
  const isFull = joinedCount >= tournament.maxPlayers;

  return (
    <div className="simple-card flex flex-col gap-3 p-4 font-sans text-white">
      <div className="flex items-center justify-between gap-2">
        <span className="simple-pill simple-pill-active px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
          {getBuyInLabel(tournament.buyIn)}
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={tournament.status} />
          {tournament.status === 'iniziata' && (
            <button
              type="button"
              aria-label="Guarda partita live"
              className="rounded-full p-1.5 text-white/60 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Best Of</span>
          <p className="mt-0.5 font-bold tabular-nums text-white">{BEST_OF_LABEL[tournament.bestOf]}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Registrati</span>
          <p className="mt-0.5 flex items-center gap-1 font-bold tabular-nums text-white">
            {joinedCount}/{tournament.maxPlayers}
            {tournament.isPrivate && <Lock className="h-3.5 w-3.5 text-amber-500" />}
          </p>
        </div>
      </div>

      {joinedCount === 0 && tournament.status !== 'in_registrazione' ? (
        <span className="text-xs text-white/45">Nessun partecipante</span>
      ) : (
        <div className="flex flex-wrap gap-1.5 border-t border-white/[0.04] pt-3">
          {tournament.participants.map((p) => {
            const { country, deck } = getMockParticipantDetails(p.username, tournament.format);
            return (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/80 ring-1 ring-white/10"
              >
                <span>{country.flag}</span>
                <span className="font-semibold">{p.username}</span>
                <span className="max-w-[72px] truncate text-[10px] text-white/40">{deck}</span>
              </span>
            );
          })}
          {tournament.status === 'in_registrazione' && !isFull && (
            <MobileJoinButton isPrivate={tournament.isPrivate} />
          )}
        </div>
      )}
    </div>
  );
}
