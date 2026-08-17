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
 * Banner del duellante: profilo compatto con emblema, gamertag, grado e
 * le tre gemme di battaglia (Vittorie / Win Rate / Sconfitte).
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

      <div className="relative grid gap-5 p-4 sm:p-5 sm:py-5 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        {/* Emblema con anello di grado rotante e dimensioni bilanciate */}
        <div className="mx-auto lg:mx-0">
          <div className="relative grid h-20 w-20 place-items-center sm:h-22 sm:w-22">
            <span
              aria-hidden
              className="pt-ring-spin absolute inset-0 rounded-full border border-dashed border-marquee/35"
            />
            <span aria-hidden className="absolute inset-1.5 rounded-full border border-marquee/15" />
            <span className="swords-emblem relative grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-lg shadow-orange-950/50">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-black/30"
              />
              <ClashingSwordsIcon className="relative h-8 w-8" />
            </span>
          </div>
        </div>

        {/* Identità: gamertag, stelle, partite concluse */}
        <div className="min-w-0 text-center lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Duellante della fucina
          </p>
          <h2 className="mt-0.5 truncate font-display text-xl font-black tracking-tight text-white sm:text-2xl">
            {gamertag}
          </h2>

          <div
            className="mt-1 flex items-center justify-center gap-1 lg:justify-start"
            aria-label={`Grado ${stars} ${stars === 1 ? 'stella' : 'stelle'}`}
          >
            {Array.from({ length: stars }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className="h-3 w-3 fill-amber-300 text-amber-300 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)]"
              />
            ))}
          </div>

          <p className="mt-1.5 text-xs font-semibold text-slate-400">
            {stats.played === 0 ? (
              'Nessuna battaglia ancora: siediti a un tavolo e combatti.'
            ) : (
              <>
                <span className="font-bold tabular-nums text-white">{stats.played}</span>{' '}
                {stats.played === 1 ? 'battaglia' : 'battaglie'}
                <span className="mx-1.5 text-white/20">·</span>
                <span className="font-bold tabular-nums text-white">{decided}</span> concluse
              </>
            )}
          </p>

          {recent.length > 0 && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 lg:justify-start">
              <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-500">
                Ultime:
              </span>
              {recent.map((m, index) => (
                <span
                  key={index}
                  aria-hidden
                  title={`${m.outcome} vs ${m.opponentGamertag ?? 'avversario'}`}
                  className={cn('h-2 w-2 rounded-full ring-1 ring-black/40', OUTCOME_DOT[m.outcome] ?? OUTCOME_DOT.disputed)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Gemme di battaglia compatte */}
        <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2 sm:gap-2.5 lg:w-auto lg:max-w-none">
          <HeroGem
            label="Vittorie"
            value={stats.wins}
            gemClass="from-marquee/20 to-marquee/5 border-marquee/20"
            icon={<WinEmblem className="h-5 w-5 text-marquee" />}
            valueClass="text-marquee"
          />
          <HeroGem
            label="Win Rate"
            value={`${winRate}%`}
            gemClass="from-primary/20 to-primary/5 border-primary/20"
            icon={<CrystalStatIcon className="pt-hero-crystal h-5 w-5 text-primary" />}
            valueClass="text-primary"
          />
          <HeroGem
            label="Sconfitte"
            value={stats.losses}
            gemClass="from-rose-500/20 to-rose-500/5 border-rose-500/20"
            icon={<SkullStatIcon className="h-5 w-5 text-rose-400" />}
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
        'relative flex min-w-[76px] flex-col items-center gap-1 rounded-xl border bg-gradient-to-b px-3 py-2.5 shadow-md shadow-black/30 backdrop-blur-sm sm:min-w-[84px]',
        gemClass,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {icon}
      <span className={cn('font-display text-xl font-black tabular-nums leading-none sm:text-2xl', valueClass)}>
        {value}
      </span>
      <span className="text-[8px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
    </div>
  );
}
