import { Star } from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
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

const MAX_RANK_STARS = 9;

function rankStarsForWins(wins: number): number {
  return Math.min(MAX_RANK_STARS, 1 + Math.floor(Math.max(0, wins) / 5));
}

/**
 * Banner del duellante: ritratto con emblema animato, gamertag, grado e
 * le tre "gemme" di battaglia (Vittorie / Win Rate / Sconfitte).
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
    <section className="relative overflow-hidden rounded-3xl border border-marquee/25 bg-header-bg/95 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_18%_0%,rgba(255,115,0,0.16),transparent_65%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_360px_at_88%_100%,rgba(243,199,106,0.1),transparent_60%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-marquee/50 to-transparent"
      />

      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        {/* Emblema: spade incrociate che cozzano, anello di grado rotante. */}
        <div className="mx-auto lg:mx-0">
          <div className="relative grid h-28 w-28 place-items-center">
            <span
              aria-hidden
              className="pt-ring-spin absolute inset-0 rounded-full border border-dashed border-marquee/40"
            />
            <span aria-hidden className="absolute inset-2.5 rounded-full border border-marquee/20" />
            <span className="swords-emblem relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 via-transparent to-black/25"
              />
              <ClashingSwordsIcon className="relative h-10 w-10" />
            </span>
          </div>
        </div>

        {/* Identità: gamertag, grado, riepilogo e ultime battaglie. */}
        <div className="min-w-0 text-center lg:text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Duellante della fucina
          </p>
          <h2 className="mt-1 truncate font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
            {gamertag}
          </h2>

          <div
            className="mt-1.5 flex items-center justify-center gap-1 lg:justify-start"
            aria-label={`Grado ${stars} ${stars === 1 ? 'stella' : 'stelle'}`}
          >
            {Array.from({ length: stars }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className="h-3 w-3 fill-amber-300 text-amber-300 drop-shadow-[0_0_4px_rgba(245,158,11,0.9)]"
              />
            ))}
          </div>

          <p className="mt-2.5 text-xs font-semibold text-white/55">
            {stats.played === 0 ? (
              'Nessuna battaglia ancora: siediti a un tavolo e combatti.'
            ) : (
              <>
                <span className="font-black tabular-nums text-white">{stats.played}</span>{' '}
                {stats.played === 1 ? 'battaglia combattuta' : 'battaglie combattute'}
                <span className="mx-1.5 text-white/25">·</span>
                <span className="font-black tabular-nums text-white">{decided}</span> concluse
              </>
            )}
          </p>

          {recent.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 lg:justify-start">
              <span className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                Ultime
              </span>
              {recent.map((m, index) => (
                <span
                  key={index}
                  aria-hidden
                  title={`${m.outcome} vs ${m.opponentGamertag ?? 'avversario'}`}
                  className={cn('h-2 w-2 rounded-full', OUTCOME_DOT[m.outcome] ?? OUTCOME_DOT.disputed)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Gemme di battaglia: V / WR / P. */}
        <div className="mx-auto grid w-full max-w-xs grid-cols-3 gap-2.5 sm:gap-3 lg:w-auto lg:max-w-none">
          <HeroGem
            label="Vittorie"
            value={stats.wins}
            gemClass="from-marquee/30 to-marquee/5"
            icon={<WinEmblem className="h-6 w-6 text-marquee" />}
            valueClass="text-marquee"
          />
          <HeroGem
            label="Win Rate"
            value={`${winRate}%`}
            gemClass="from-primary/30 to-primary/5"
            icon={<CrystalStatIcon className="pt-hero-crystal h-6 w-6 text-primary" />}
            valueClass="text-primary"
          />
          <HeroGem
            label="Sconfitte"
            value={stats.losses}
            gemClass="from-rose-500/30 to-rose-500/5"
            icon={<SkullStatIcon className="h-6 w-6 text-rose-400" />}
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
      className={`relative flex min-w-[84px] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-gradient-to-b p-3 shadow-lg shadow-black/40 ${gemClass}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      {icon}
      <span className={cn('font-display text-2xl font-black tabular-nums leading-none', valueClass)}>
        {value}
      </span>
      <span className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/50">
        {label}
      </span>
    </div>
  );
}
