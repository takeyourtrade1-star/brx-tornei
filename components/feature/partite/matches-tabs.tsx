import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { MatchTab } from '@/lib/validations/match-filters';
import { MATCH_TABS } from '@/lib/validations/match-filters';
import type { Selection } from '@/lib/validations/selection';

function buildTabHref(tab: MatchTab, selection: Selection): string {
  const params = new URLSearchParams({
    tab,
    format: selection.format,
    mode: selection.mode,
  });
  return `/partite?${params.toString()}`;
}

/**
 * Filtri tab server-side via Link — nessun client state.
 */
export function MatchesTabs({
  currentTab,
  selection,
  counts,
}: {
  currentTab: MatchTab;
  selection: Selection;
  counts: Record<MatchTab, number>;
}) {
  return (
    <nav aria-label="Filtra partite" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
      {MATCH_TABS.map((tab) => {
        const isActive = tab.id === currentTab;
        return (
          <Link
            key={tab.id}
            href={buildTabHref(tab.id, selection)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ring-1 transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground ring-primary/50 shadow-lg'
                : 'bg-white/10 text-white ring-white/20 hover:bg-white/20'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs tabular-nums',
                isActive ? 'bg-white/20' : 'bg-white/10 text-white/70'
              )}
            >
              {counts[tab.id]}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
