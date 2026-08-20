import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { AbandonedEmblem } from '@/components/feature/tornei/partite/partite-outcome-icons';
import {
  CrownStatIcon,
  CrystalStatIcon,
  FlameStatIcon,
  ShieldStatIcon,
  SkullStatIcon,
} from '@/components/feature/tornei/partite/partite-stats-icons';
import { StatBadgeCard } from '@/components/feature/tornei/partite/stat-badge-card';
import { calculateWinStreak } from '@/lib/rank';
import { ClashingSwordsIcon } from './clashing-swords-icon';
import { RecentResultsStrip } from './recent-results-strip';

/**
 * Card "Le tue partite" (home lobby): emblema arena a sinistra,
 * HUD centrale arricchito con forma recente e statistiche a destra.
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

  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const winStreak = calculateWinStreak(stats);
  const fairPlayRate = stats.played > 0 ? Math.round((decided / stats.played) * 100) : 100;

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
        {/* Emblema a sinistra + Sezione centrale HUD */}
        <div className="relative flex min-w-0 flex-1 items-stretch gap-3.5 p-3 sm:gap-4 sm:p-3.5">
          {/* Emblema Arena a sinistra */}
          <div className="swords-emblem relative grid min-h-[132px] w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/25 bg-slate-950/85 text-white shadow-lg shadow-black/35 sm:w-[104px]">
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

          {/* Sezione Centrale Ricca e Informata */}
          <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            {/* Header partite + Micro-Badge HUD */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
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
              </div>

              {/* Micro-badge HUD prestazionali */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div
                  title={`Tasso di vittoria: ${winRate}%`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.12)] backdrop-blur-sm"
                >
                  <CrystalStatIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-display text-[11px] font-black tabular-nums leading-none sm:text-xs">
                    {winRate}%
                  </span>
                  <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-400/80">
                    Win Rate
                  </span>
                </div>

                {winStreak >= 2 ? (
                  <div
                    title={`Striscia vincente: ${winStreak} di fila`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/35 bg-amber-950/40 px-2.5 py-1 text-amber-300 shadow-[0_0_12px_rgba(251,146,60,0.18)] backdrop-blur-sm"
                  >
                    <FlameStatIcon className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-display text-[11px] font-black tabular-nums leading-none sm:text-xs">
                      {winStreak}V
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-amber-400/80">
                      {winStreak >= 3 ? 'On Fire' : 'Streak'}
                    </span>
                  </div>
                ) : (
                  <div
                    title={`Fair Play: ${fairPlayRate}%`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-950/30 px-2.5 py-1 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.10)] backdrop-blur-sm"
                  >
                    <ShieldStatIcon className="h-3.5 w-3.5 text-sky-400" />
                    <span className="font-display text-[11px] font-black tabular-nums leading-none sm:text-xs">
                      {fairPlayRate}%
                    </span>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-sky-400/80">
                      Fair Play
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Barra di bilanciamento esiti (Match Ratio Bar) */}
            <div className="my-1.5 flex flex-col gap-1">
              <div
                title={`Distribuzione: ${stats.wins} vinte, ${stats.losses} perse, ${stats.abandoned} abbandonate`}
                className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/10"
              >
                {stats.played > 0 ? (
                  <>
                    {stats.wins > 0 && (
                      <span
                        style={{ width: `${(stats.wins / stats.played) * 100}%` }}
                        className="bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] transition-all duration-500"
                      />
                    )}
                    {stats.losses > 0 && (
                      <span
                        style={{ width: `${(stats.losses / stats.played) * 100}%` }}
                        className="bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] transition-all duration-500"
                      />
                    )}
                    {stats.abandoned > 0 && (
                      <span
                        style={{ width: `${(stats.abandoned / stats.played) * 100}%` }}
                        className="bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] transition-all duration-500"
                      />
                    )}
                  </>
                ) : (
                  <span className="w-full bg-slate-800" />
                )}
              </div>
            </div>

            {/* Gettoni forma recente */}
            <RecentResultsStrip recent={recent} />
          </div>
        </div>

        {/* Esiti compatti a destra */}
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
