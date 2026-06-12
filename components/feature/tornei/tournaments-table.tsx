import type { Tournament } from '@/types/tournament';
import { TOURNAMENT_FORM_LABEL } from '@/lib/tournaments/display';
import { StatusBadge } from './status-badge';
import { ParticipateButton } from './participate-button';
import { TournamentMobileCard } from './tournament-mobile-card';
import { TournamentsEmptyState } from './tournaments-empty-state';
import { ParticipantChip } from './participant-chip';
import { RegistrationMeter } from './registration-meter';
import { Eye, Lock } from 'lucide-react';

/**
 * Lista tornei: card su mobile, tabella glass su desktop.
 * I dati arrivano già pronti dalla pagina (server component).
 */
export function TournamentsTable({
  tournaments,
  isLoggedIn,
}: {
  tournaments: Tournament[];
  isLoggedIn: boolean;
}) {
  if (tournaments.length === 0) {
    return <TournamentsEmptyState />;
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:hidden">
        {tournaments.map((t) => (
          <TournamentMobileCard key={t.id} tournament={t} isLoggedIn={isLoggedIn} />
        ))}
      </div>

      <div className="brx-glass hidden overflow-x-auto rounded-3xl border border-white/15 md:block">
        <table className="w-full text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/15 font-sans text-xs font-bold uppercase tracking-widest text-marquee">
              <th scope="col" className="px-6 py-4">Buy-In</th>
              <th scope="col" className="px-6 py-4">Forma</th>
              <th scope="col" className="px-6 py-4">Stato</th>
              <th scope="col" className="px-6 py-4">Registrati</th>
              <th scope="col" className="px-6 py-4">Partecipanti</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <TournamentDesktopRow key={t.id} tournament={t} isLoggedIn={isLoggedIn} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TournamentDesktopRow({
  tournament: t,
  isLoggedIn,
}: {
  tournament: Tournament;
  isLoggedIn: boolean;
}) {
  const isOpen = t.status === 'in_registrazione';
  const rowMuted = t.status === 'terminata';

  return (
    <tr
      className={`border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.05] ${
        rowMuted ? 'opacity-75' : ''
      }`}
    >
      <td className="px-6 py-5">
        <span className="rounded-full bg-marquee/10 px-2.5 py-1 font-sans text-xs font-bold uppercase tracking-wide text-marquee ring-1 ring-marquee/25">
          For Fun
        </span>
      </td>
      <td className="px-6 py-5">
        <span className="font-display text-xl font-black tabular-nums text-white">
          {TOURNAMENT_FORM_LABEL[t.bestOf]}
        </span>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-2">
          <StatusBadge status={t.status} />
          {t.status === 'iniziata' && (
            <span className="group relative shrink-0 cursor-pointer">
              <Eye className="h-4 w-4 text-red-300/80 transition-colors group-hover:text-red-200" />
              <span className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-36 -translate-x-1/2 group-hover:block">
                <span className="animate-auth-enter block">
                  <span className="block rounded-lg border border-white/20 bg-slate-950/95 px-2 py-1 text-center text-[10px] font-bold text-white shadow-xl backdrop-blur-md">
                    Guarda partita live
                  </span>
                  <span className="mx-auto -mt-1 block h-1.5 w-1.5 rotate-45 border-b border-r border-white/20 bg-slate-950/95" />
                </span>
              </span>
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="min-w-[7rem] space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black tabular-nums text-white">
              {t.participants.length}
              <span className="text-base font-bold text-white/45">/{t.maxPlayers}</span>
            </span>
            {t.isPrivate && (
              <span className="group relative shrink-0 cursor-help">
                <Lock className="h-4 w-4 text-amber-400" aria-label="Partita privata" />
                <span className="absolute bottom-full left-1/2 z-30 mb-2 hidden w-28 -translate-x-1/2 group-hover:block">
                  <span className="animate-auth-enter block">
                    <span className="block rounded-lg border border-white/20 bg-slate-950/95 px-2 py-1 text-center text-[10px] font-bold text-white shadow-xl backdrop-blur-md">
                      Partita privata
                    </span>
                    <span className="mx-auto -mt-1 block h-1.5 w-1.5 rotate-45 border-b border-r border-white/20 bg-slate-950/95" />
                  </span>
                </span>
              </span>
            )}
          </div>
          {isOpen && (
            <RegistrationMeter current={t.participants.length} max={t.maxPlayers} />
          )}
        </div>
      </td>
      <td className="overflow-visible px-6 py-5">
        {t.participants.length === 0 && !isOpen ? (
          <span className="text-white/35">—</span>
        ) : (
          <ul className="flex flex-wrap items-center gap-2">
            {t.participants.map((p) => (
              <li key={p.id}>
                <ParticipantChip participant={p} format={t.format} />
              </li>
            ))}
            {isOpen && (
              <li className="ml-1">
                <ParticipateButton
                  tournamentId={t.id}
                  isLoggedIn={isLoggedIn}
                  isPrivate={!!t.isPrivate}
                />
              </li>
            )}
          </ul>
        )}
      </td>
    </tr>
  );
}
