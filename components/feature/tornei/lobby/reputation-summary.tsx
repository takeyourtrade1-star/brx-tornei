import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { AbandonedEmblem } from '@/components/feature/tornei/partite/partite-outcome-icons';
import { CrownStatIcon, SkullStatIcon } from '@/components/feature/tornei/partite/partite-stats-icons';
import { StatBadgeCard } from '@/components/feature/tornei/partite/stat-badge-card';
import { ClashingSwordsIcon } from './clashing-swords-icon';

const OUTCOME_TONE: Record<string, { dot: string; label: string }> = {
  win: { dot: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.16)]', label: 'Vittoria' },
  loss: { dot: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.16)]', label: 'Sconfitta' },
  abandoned: { dot: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.16)]', label: 'Abbandonata' },
  disputed: { dot: 'bg-slate-400 shadow-[0_0_0_2px_rgba(148,163,184,0.16)]', label: 'Contestata' },
};

/**
 * Card "Le tue partite" (home lobby): divisa a metà — a sinistra emblema
 * animato + totale partite + ultime sfide, a destra le statistiche di esito.
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
      className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md shadow-md"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Metà sinistra: emblema + totale + ultime sfide. */}
        <div className="flex flex-1 flex-col gap-2.5 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-3.5">
            <span className="swords-emblem relative grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-sm">
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-black/20"
              />
              <ClashingSwordsIcon className="relative h-[26px] w-[26px]" />
            </span>

            <p className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                Le tue partite
              </span>
              <span className="block text-xl font-black tabular-nums leading-tight text-white">
                {stats.played}
                <span className="ml-1.5 text-[11px] font-semibold text-white/50">
                  {stats.played === 1 ? 'partita' : 'partite'}
                </span>
              </span>
            </p>
          </div>

          {recent.length > 0 ? (
            <div
              role="img"
              aria-label={`Ultime sfide: ${recent.slice(0, 5).map((m) => OUTCOME_TONE[m.outcome]?.label ?? m.outcome).join(', ')}`}
              className="flex items-center gap-1.5"
            >
              <span className="hidden text-[8px] font-black uppercase tracking-[0.16em] text-white/50 sm:inline">
                Ultime
              </span>
              {recent.slice(0, 5).map((m, index) => (
                <span
                  key={index}
                  aria-hidden
                  title={`${OUTCOME_TONE[m.outcome]?.label ?? m.outcome} vs ${m.opponentGamertag ?? 'avversario'}`}
                  className={cn('h-2.5 w-2.5 rounded-full', OUTCOME_TONE[m.outcome]?.dot ?? 'bg-slate-400')}
                />
              ))}
            </div>
          ) : (
            <span className="hidden text-[10px] font-bold leading-tight text-white/50 sm:block">
              Nessuna sfida ancora: siediti a un tavolo.
            </span>
          )}
        </div>

        {/* Esiti compatti con la stessa estetica delle statistiche in /partite. */}
        <div
          aria-label="Esiti delle tue partite"
          className="grid grid-cols-3 gap-2 border-t border-white/10 bg-black/10 p-2 sm:w-[340px] sm:shrink-0 sm:border-l sm:border-t-0"
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
