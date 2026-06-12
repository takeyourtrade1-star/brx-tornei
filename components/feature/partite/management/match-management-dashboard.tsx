import Link from 'next/link';
import { ArrowLeft, Monitor, Swords } from 'lucide-react';
import { getFormat } from '@/lib/data/catalog';
import { BEST_OF_LABEL } from '@/lib/matches/best-of';
import { formatMatchDateTime } from '@/lib/matches/format-datetime';
import { MatchStatusBadge } from '@/components/feature/partite/match-status-badge';
import type { MatchDetail } from '@/types/match';
import { JudgeCallsPanel } from './judge-calls-panel';
import { MatchScorePanel } from './match-score-panel';
import { MatchTimeline } from './match-timeline';
import { PhoneStreamTeaser } from './phone-stream-teaser';

interface MatchManagementDashboardProps {
  match: MatchDetail;
}

/** Centro gestione match — riepilogo, punteggi, giudice, timeline. */
export function MatchManagementDashboard({ match }: MatchManagementDashboardProps) {
  const format = getFormat(match.format);

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 pb-16 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black uppercase tracking-wide text-white sm:text-3xl">
              Gestione <span className="text-primary">match</span>
            </h1>
            <MatchStatusBadge status={match.status} activePhase={match.activePhase} />
          </div>
          <p className="mt-1 text-sm text-white/60">{match.tournamentLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/partite/${match.id}/tavolo`}
            className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide text-white"
          >
            <Monitor className="h-4 w-4" />
            Torna al tavolo
          </Link>
          <Link
            href="/partite?tab=attive"
            className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/80 transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Alle partite
          </Link>
        </div>
      </header>

      <section className="brx-glass rounded-2xl border border-white/15 p-5">
        <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-marquee">
          <Swords className="h-4 w-4" />
          Riepilogo match
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Formato</dt>
            <dd className="mt-0.5 font-semibold text-white">{format?.name ?? match.format}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Best of</dt>
            <dd className="mt-0.5 font-semibold text-white">{BEST_OF_LABEL[match.bestOf]}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Avversario</dt>
            <dd className="mt-0.5 font-semibold text-white">{match.opponent}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Il tuo mazzo</dt>
            <dd className="mt-0.5 font-semibold text-marquee">{match.deckName}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Inizio</dt>
            <dd className="mt-0.5 font-semibold text-white/90">{formatMatchDateTime(match.startsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Fine stimata</dt>
            <dd className="mt-0.5 font-semibold text-white/90">{formatMatchDateTime(match.endsAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Punteggio match</dt>
            <dd className="mt-0.5 text-xl font-black tabular-nums text-white">
              {match.scoreState.selfGames} — {match.scoreState.opponentGames}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-white/45">Stato</dt>
            <dd className="mt-0.5 font-semibold text-white/90">
              {match.scoreState.isFinished ? 'Conclusa' : 'In corso'}
            </dd>
          </div>
        </dl>
      </section>

      <PhoneStreamTeaser />

      <div className="grid gap-6 lg:grid-cols-2">
        <MatchScorePanel match={match} />
        <JudgeCallsPanel calls={match.judgeCalls} />
      </div>

      <MatchTimeline events={match.events} />
    </div>
  );
}
