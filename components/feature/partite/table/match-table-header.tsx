import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Timer } from 'lucide-react';
import { MatchStatusBadge } from '@/components/feature/partite/match-status-badge';
import type { MatchDetail } from '@/types/match';
import { MatchTableTimer } from './match-table-timer';

interface MatchTableHeaderProps {
  match: MatchDetail;
}

/** Header compatto tavolo: torneo, avversario, timer demo. */
export function MatchTableHeader({ match }: MatchTableHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <Link
          href="/partite?tab=attive"
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Torna alle partite"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate font-sans text-lg font-bold text-white sm:text-xl">
              {match.tournamentLabel}
            </h1>
            <MatchStatusBadge status={match.status} activePhase={match.activePhase} />
          </div>
          <p className="mt-0.5 text-sm text-white/60">
            vs <span className="font-semibold text-white/90">{match.opponent}</span>
            {' · '}
            <span className="text-marquee">{match.deckName}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80">
          <Timer className="h-4 w-4 text-marquee" aria-hidden />
          <MatchTableTimer endsAt={match.endsAt} />
        </div>
        <Link
          href={`/partite/${match.id}/gestione`}
          className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          Gestione match
        </Link>
      </div>
    </header>
  );
}
