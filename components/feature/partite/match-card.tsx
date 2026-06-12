import Link from 'next/link';
import { LayoutDashboard, Monitor } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { BEST_OF_LABEL } from '@/lib/matches/best-of';
import { formatMatchDateTime } from '@/lib/matches/format-datetime';
import type { Match } from '@/types/match';
import { MatchResultBadge } from './match-result-badge';
import { MatchStatusBadge } from './match-status-badge';

/** Singola riga partita nella lista. */
export function MatchCard({ match }: { match: Match }) {
  const format = getFormat(match.format);

  return (
    <li className="flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-sans text-base font-bold text-white">{match.tournamentLabel}</h2>
          <MatchStatusBadge status={match.status} activePhase={match.activePhase} />
          {match.result && <MatchResultBadge result={match.result} />}
        </div>
        <p className="mt-1 text-sm text-white/55">
          {format?.name ?? match.format} · {BEST_OF_LABEL[match.bestOf]}
        </p>
        <p className="mt-1 text-xs text-white/45">
          Inizio: <span className="font-semibold text-white/70">{formatMatchDateTime(match.startsAt)}</span>
          {' · '}
          Fine stimata:{' '}
          <span className="font-semibold text-white/70">{formatMatchDateTime(match.endsAt)}</span>
        </p>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Avversario</dt>
            <dd className="mt-0.5 font-semibold text-white/90">{match.opponent}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Il tuo mazzo</dt>
            <dd className="mt-0.5 font-semibold text-marquee">{match.deckName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Punteggio</dt>
            <dd className="mt-0.5 font-bold tabular-nums text-white/90">{match.score ?? '—'}</dd>
          </div>
        </dl>
      </div>

      {match.status === 'attiva' && match.activePhase === 'in_corso' && (
        <div className="flex shrink-0 flex-col gap-2 self-start sm:self-center">
          <Link
            href={`/partite/${match.id}/tavolo`}
            target="_blank"
            rel="noopener noreferrer"
            className="brx-liquid-glass-btn flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wide text-white"
          >
            <Monitor className="h-4 w-4" />
            Visualizza tavolo
          </Link>
          <Link
            href={`/partite/${match.id}/gestione`}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white/85 transition-colors hover:bg-white/10"
          >
            <LayoutDashboard className="h-4 w-4" />
            Gestione match
          </Link>
        </div>
      )}
    </li>
  );
}
