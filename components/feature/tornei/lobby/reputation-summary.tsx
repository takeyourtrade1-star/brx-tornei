import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { AbandonedEmblem } from '@/components/feature/tornei/partite/partite-outcome-icons';
import { CrownStatIcon, SkullStatIcon } from '@/components/feature/tornei/partite/partite-stats-icons';
import { StatBadgeCard } from '@/components/feature/tornei/partite/stat-badge-card';
import { ClashingSwordsIcon } from './clashing-swords-icon';
import { RecentResultsStrip } from './recent-results-strip';

/**
 * Card "Le tue partite" (home lobby): emblema arena e forma recente a sinistra,
 * statistiche full-card a destra.
 */
export function ReputationSummary({ reputation }: { reputation: ReputationSummaryData | null }) {
  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const recent = reputation?.recent ?? [];

  return (
    <section
      aria-label="Le tue partite"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90 text-white shadow-xl shadow-black/35 backdrop-blur-md"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(420px_180px_at_12%_45%,rgba(255,115,0,0.14),transparent_72%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(440px_180px_at_96%_100%,rgba(56,189,248,0.07),transparent_75%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="flex flex-col sm:flex-row">
        {/* Emblema ampio a sinistra; gerarchia e forma recente alla sua destra. */}
        <div className="relative flex min-w-0 flex-1 items-stretch gap-3.5 p-3 sm:gap-4 sm:p-3.5">
          <div className="swords-emblem relative grid min-h-[124px] w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/25 bg-slate-950/85 text-white shadow-lg shadow-black/35 sm:w-[104px]">
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,115,0,0.42),rgba(255,115,0,0.08)_48%,transparent_74%)]"
            />
            <span aria-hidden className="absolute inset-2 rounded-xl border border-white/[0.07]" />
            <span aria-hidden className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            <span className="relative grid h-[78px] w-[78px] place-items-center">
              <span
                aria-hidden
                className="absolute inset-2 rounded-full bg-primary/20 blur-xl"
              />
              <ClashingSwordsIcon ornate className="relative h-[72px] w-[72px] drop-shadow-[0_0_14px_rgba(255,115,0,0.45)]" />
            </span>
            <span className="absolute bottom-2 rounded-full border border-white/10 bg-black/25 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] text-white/55">
              Arena
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
              Le tue partite
            </p>
            <p className="mt-0.5 flex items-baseline gap-2">
              <span className="font-display text-3xl font-black tabular-nums leading-none text-white sm:text-4xl">
                {stats.played}
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {stats.played === 1 ? 'partita giocata' : 'partite giocate'}
              </span>
            </p>
            <span aria-hidden className="my-2 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
            <RecentResultsStrip recent={recent} />
          </div>
        </div>

        {/* Esiti compatti con la stessa estetica delle statistiche in /partite. */}
        <div
          aria-label="Esiti delle tue partite"
          className="relative grid grid-cols-3 gap-2 border-t border-white/10 bg-black/15 p-2 sm:w-[340px] sm:shrink-0 sm:border-l sm:border-t-0"
        >
          <StatBadgeCard
            label="Vinte"
            value={stats.wins}
            Icon={CrownStatIcon}
            iconColor="text-amber-400"
            bgGlow="rgba(251,191,36,0.22)"
            variant="compact"
            className="min-w-0"
          />
          <StatBadgeCard
            label="Perse"
            value={stats.losses}
            Icon={SkullStatIcon}
            iconColor="text-rose-400"
            bgGlow="rgba(251,113,133,0.20)"
            variant="compact"
            className="min-w-0"
          />
          <StatBadgeCard
            label="Abbandonate"
            value={stats.abandoned}
            Icon={AbandonedEmblem}
            iconColor="text-orange-400"
            bgGlow="rgba(251,146,60,0.20)"
            variant="compact"
            className="min-w-0"
          />
        </div>
      </div>
    </section>
  );
}
