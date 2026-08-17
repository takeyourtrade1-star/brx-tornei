import { Star } from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { rankStarsForWins } from '@/lib/rank';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from '@/components/feature/tornei/lobby/clashing-swords-icon';
import { CrystalStatIcon, SkullStatIcon } from './partite-stats-icons';
import { WinEmblem } from './partite-outcome-icons';

const OUTCOME_DOT: Record<string, string> = {
  win: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
  loss: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]',
  abandoned: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]',
  disputed: 'bg-slate-400 shadow-[0_0_6px_rgba(148,163,184,0.7)]',
};

/**
 * Banner del duellante pulito e arioso: identità con chip orizzontali e gemme di battaglia.
 */
export function PartiteHero({
  gamertag,
  reputation,
}: {
  gamertag: string;
  reputation: ReputationSummaryData | null;
}) {
  const stats: ReputationSummaryData = reputation ?? {
    played: 0,
    wins: 0,
    losses: 0,
    abandoned: 0,
    disputed: 0,
    recent: [],
    history: [],
  };
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : 0;
  const stars = rankStarsForWins(stats.wins);
  const recent = stats.recent.slice(0, 6);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#0e1626]/95 via-[#0a0f1d]/95 to-[#060a14]/95 shadow-xl shadow-black/40 backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_200px_at_15%_0%,rgba(255,115,0,0.12),transparent_70%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(500px_200px_at_85%_100%,rgba(243,199,106,0.08),transparent_70%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-marquee/40 to-transparent"
      />

      <div className="relative flex flex-col gap-5 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Blocco Identità: Emblema + Gamertag + Chip orizzontali */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 text-center sm:text-left min-w-0">
          <div className="relative grid h-16 w-16 place-items-center shrink-0 sm:h-18 sm:w-18">
            <span
              aria-hidden
              className="pt-ring-spin absolute inset-0 rounded-full border border-dashed border-marquee/35"
            />
            <span aria-hidden className="absolute inset-1 rounded-full border border-marquee/15" />
            <span className="swords-emblem relative grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-lg shadow-orange-950/50">
              <ClashingSwordsIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </span>
          </div>

          <div className="min-w-0 flex flex-col items-center sm:items-start gap-1.5">
            <h2 className="truncate font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              {gamertag}
            </h2>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              {/* Chip Grado Stelle */}
              <div
                className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1"
                title={`Grado: ${stars} stelle`}
              >
                {Array.from({ length: Math.max(1, stars) }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className="h-3 w-3 fill-amber-300 text-amber-300 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]"
                  />
                ))}
              </div>

              {/* Chip Forma Recente (Dot LED) */}
              {recent.length > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Forma:
                  </span>
                  <div className="flex items-center gap-1">
                    {recent.map((m, index) => (
                      <span
                        key={index}
                        aria-hidden
                        title={`${m.outcome} vs ${m.opponentGamertag ?? 'avversario'}`}
                        className={cn('h-2 w-2 rounded-full ring-1 ring-black/40', OUTCOME_DOT[m.outcome] ?? OUTCOME_DOT.disputed)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gemme di battaglia compatte */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 shrink-0 self-center sm:self-auto">
          <HeroGem
            label="Vittorie"
            value={stats.wins}
            gemClass="from-marquee/20 to-marquee/5 border-marquee/20"
            icon={<WinEmblem className="h-5 w-5 sm:h-6 sm:w-6 text-marquee" />}
            valueClass="text-marquee"
          />
          <HeroGem
            label="Win Rate"
            value={`${winRate}%`}
            gemClass="from-primary/20 to-primary/5 border-primary/20"
            icon={<CrystalStatIcon className="pt-hero-crystal h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
            valueClass="text-primary"
          />
          <HeroGem
            label="Sconfitte"
            value={stats.losses}
            gemClass="from-rose-500/20 to-rose-500/5 border-rose-500/20"
            icon={<SkullStatIcon className="h-5 w-5 sm:h-6 sm:w-6 text-rose-400" />}
            valueClass="text-rose-300"
          />
        </div>
      </div>
    </section>
  );
}

function HeroGem({
  label,
  value,
  gemClass,
  icon,
  valueClass,
}: {
  label: string;
  value: string | number;
  gemClass: string;
  icon: React.ReactNode;
  valueClass: string;
}) {
  return (
    <div
      className={cn(
        'relative flex min-w-[72px] sm:min-w-[80px] flex-col items-center gap-1 rounded-xl border bg-gradient-to-b px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-md shadow-black/30 backdrop-blur-sm',
        gemClass,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {icon}
      <span className={cn('font-display text-lg sm:text-xl font-black tabular-nums leading-none', valueClass)}>
        {value}
      </span>
      <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
    </div>
  );
}
