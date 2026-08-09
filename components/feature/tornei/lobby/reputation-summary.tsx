import { LogOut, Skull, Swords, Trophy, type LucideIcon } from 'lucide-react';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';
import { cn } from '@/lib/utils';

const OUTCOME_TONE: Record<string, { dot: string; label: string }> = {
  win: { dot: 'bg-emerald-500', label: 'Vittoria' },
  loss: { dot: 'bg-red-500', label: 'Sconfitta' },
  abandoned: { dot: 'bg-amber-500', label: 'Abbandonata' },
  disputed: { dot: 'bg-slate-400', label: 'Contestata' },
};

/**
 * Card "Le tue partite" (home lobby): un blocco a una banda, stile profilo
 * esports — identità + contatori + winrate sottile + esito delle ultime
 * sfide come pallini colore. Niente doppioni: il winrate vive qui come
 * barretta, i badge restano nel drawer profilo.
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
      className="overflow-hidden rounded-2xl border border-slate-900/[0.08] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
    >
      {/* Banda identità: emblem + totale + from di fine corsa. */}
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-header-bg text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.45)]">
          <Swords className="h-4 w-4" aria-hidden="true" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-white" aria-hidden />
        </span>
        <p className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            Le tue partite
          </span>
          <span className="block text-lg font-black tabular-nums leading-tight text-header-bg">
            {stats.played}
            <span className="ml-1.5 text-[11px] font-semibold text-slate-400">
              {stats.played === 1 ? 'partita' : 'partite'}
            </span>
          </span>
        </p>

        {recent.length > 0 && (
          <div
            role="img"
            aria-label={`Ultime sfide: ${recent.slice(0, 5).map((m) => OUTCOME_TONE[m.outcome]?.label ?? m.outcome).join(', ')}`}
            className="ml-auto flex shrink-0 items-center gap-1.5"
          >
            <span className="hidden text-[8px] font-black uppercase tracking-[0.16em] text-slate-400 sm:block">
              Ultime
            </span>
            {recent.slice(0, 5).map((m, index) => (
              <span
                key={index}
                aria-hidden
                title={`${OUTCOME_TONE[m.outcome]?.label ?? m.outcome} vs ${m.opponentGamertag ?? 'avversario'}`}
                className={cn('h-2.5 w-2.5 rounded-full shadow-sm', OUTCOME_TONE[m.outcome]?.dot ?? 'bg-slate-300')}
              />
            ))}
          </div>
        )}
      </div>

      {/* Banda contatori: tre voci col dividers sottili, una riga. */}
      <dl className="grid grid-cols-3 divide-x divide-slate-900/[0.06] border-t border-slate-900/[0.06]">
        <Counter icon={Trophy} label="Vinte" value={stats.wins} tone="text-emerald-600" />
        <Counter icon={Skull} label="Perse" value={stats.losses} tone="text-red-500" />
        <Counter icon={LogOut} label="Abbandonate" value={stats.abandoned} tone="text-amber-600" />
      </dl>

      {/* Winrate: unica barra sottile, solo con partite decise. */}
      {winRate !== null && (
        <div className="flex items-center gap-2.5 px-4 pb-3 sm:px-5" title={`${winRate}% di vittorie`}>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] font-black tabular-nums leading-none text-slate-400">
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
      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}