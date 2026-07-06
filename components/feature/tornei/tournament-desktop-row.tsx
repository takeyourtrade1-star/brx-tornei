import { Eye, Lock, Plus, UserPlus } from 'lucide-react';
import { getBuyInLabel } from '@/lib/data/buy-in';
import { StatusBadge } from './status-badge';
import { TournamentParticipantChip } from './tournament-participant-chip';
import {
  tournamentActionButtonClass,
  tournamentActionIconClass,
} from './tournament-action-button-styles';
import { BEST_OF_LABEL } from './tournament-mock-details';
import type { Tournament } from '@/types/tournament';

interface TournamentDesktopRowProps {
  tournament: Tournament;
  onJoin?: (id: string) => void;
  onObserve?: (id: string) => void;
}

export function TournamentDesktopRow({
  tournament,
  onJoin,
  onObserve,
}: TournamentDesktopRowProps) {
  return (
    <tr className="transition-colors hover:bg-white/[0.03]">
      <td className="px-4 py-3.5">
        <span className="simple-pill simple-pill-active px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
          {getBuyInLabel(tournament.buyIn)}
        </span>
      </td>
      <td className="px-4 py-3.5 font-bold tabular-nums text-white">{BEST_OF_LABEL[tournament.bestOf]}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={tournament.status} />
          {tournament.status === 'iniziata' && (
            <button
              type="button"
              onClick={() => onObserve?.(tournament.id)}
              aria-label="Guarda partita live"
              className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
      <td className="px-4 py-3.5 font-bold tabular-nums text-white">
        <span className="inline-flex items-center gap-1.5">
          {tournament.participants.length}/{tournament.maxPlayers}
          {tournament.isPrivate && (
            <Lock className="h-3.5 w-3.5 text-amber-500" aria-label="Partita privata" />
          )}
        </span>
      </td>
      <td className="px-4 py-3.5">
        {tournament.participants.length === 0 && tournament.status !== 'in_registrazione' ? (
          <span className="text-white/40">—</span>
        ) : (
          <ul className="flex flex-wrap items-center gap-1.5">
            {tournament.participants.map((p) => (
              <TournamentParticipantChip key={p.id} participant={p} format={tournament.format} />
            ))}
            {tournament.status === 'in_registrazione' && (
              <li>
                {tournament.isPrivate ? (
                  <button
                    type="button"
                    onClick={() => onJoin?.(tournament.id)}
                    className={tournamentActionButtonClass('sm')}
                  >
                    <UserPlus className={tournamentActionIconClass} />
                    Chiedi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onJoin?.(tournament.id)}
                    className={tournamentActionButtonClass('sm')}
                  >
                    <Plus className={tournamentActionIconClass} />
                    Partecipa
                  </button>
                )}
              </li>
            )}
          </ul>
        )}
      </td>
    </tr>
  );
}
