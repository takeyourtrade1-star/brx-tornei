import { LogOut, Skull, Trophy, type LucideIcon } from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';
import { ClashingSwordsIcon } from './clashing-swords-icon';

const OUTCOME_TONE: Record<string, { dot: string; label: string }> = {
  win: { dot: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.16)]', label: 'Vittoria' },
  loss: { dot: 'bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.16)]', label: 'Sconfitta' },
  abandoned: { dot: 'bg-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.16)]', label: 'Abbandonata' },
  disputed: { dot: 'bg-slate-400 shadow-[0_0_0_2px_rgba(148,163,184,0.16)]', label: 'Contestata' },
};

/**
 * Card "Le tue partite" (home lobby): un blocco a una banda, stile profilo
 * esports — emblema animato (spade che si scontrano) + identità + contatori
 * + winrate sottile + esito delle ultime sfide come pallini colore. Niente
 * doppioni: il winrate vive qui come barretta, i badge restano nel drawer
 * profilo.
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
  const decided = stats.wins + stats.losses;
  const winRate = decided > 0 ? Math.round((stats.wins / decided) * 100) : null;
  const recent = reputation?.recent ?? [];

  return (
    <section
      aria-label="Le tue partite"
      className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md shadow-md"
    >
      {/* Banda identità: emblema + totale + esito delle ultime sfide. */}
      <div className="flex items-center gap-3.5 bg-gradient-to-r from-white/10 via-white/5 to-transparent px-4 py-3.5 sm:px-5">
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

        {recent.length > 0 ? (
          <div
            role="img"
            aria-label={`Ultime sfide: ${recent.slice(0, 5).map((m) => OUTCOME_TONE[m.outcome]?.label ?? m.outcome).join(', ')}`}
            className="ml-auto flex shrink-0 items-center gap-1.5"
          >
            <span className="hidden text-[8px] font-black uppercase tracking-[0.16em] text-white/50 sm:block">
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
          <span className="ml-auto hidden shrink-0 text-right text-[10px] font-bold leading-tight text-white/50 sm:block">
            Nessuna sfida ancora:
            <br />
            siediti a un tavolo.
          </span>
        )}
      </div>

      {/* Banda contatori: tre voci con dividers sottili. */}
      <dl className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-black/10">
        <Counter icon={Trophy} label="Vinte" value={stats.wins} tone="text-emerald-400" />
        <Counter icon={Skull} label="Perse" value={stats.losses} tone="text-red-400" />
        <Counter icon={LogOut} label="Abbandonate" value={stats.abandoned} tone="text-amber-400" />
      </dl>

      {/* Winrate: unica barra sottile sulle partite decise (vinte + perse). */}
      {winRate !== null && (
        <div
          className="flex items-center gap-2.5 px-4 py-2.5 sm:px-5 border-t border-white/5 bg-black/5"
          title={`${winRate}% di vittorie su ${decided} partite decise`}
        >
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${winRate}%` }}
            />
            <div className="h-full flex-1 bg-red-500/30" />
          </div>
          <span className="shrink-0 text-[10px] font-black tabular-nums leading-none text-white/70">
            {winRate}%
          </span>
        </div>
      )}
    </section>
  );
}

function Counter({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-2 py-2.5">
      <Icon className={cn('h-3.5 w-3.5 shrink-0', tone)} strokeWidth={2.2} aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className={cn('text-base font-black tabular-nums leading-none', tone)}>{value}</dd>
      <span className="text-[8px] font-bold uppercase tracking-wider text-white/50">{label}</span>
    </div>
  );
}
