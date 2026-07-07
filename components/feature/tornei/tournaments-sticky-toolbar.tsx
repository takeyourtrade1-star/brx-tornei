'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';
import { FormatSelectorGrid } from './format-selector-grid';
import { ModeSelectorRow } from './mode-selector-row';
import { TournamentFilters, type TournamentFiltersState } from './tournament-filters';

const SCROLL_COMPACT_ON = 80;
const SCROLL_COMPACT_OFF = 28;
const TOOLBAR_MORPH_EASE = 'duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

interface TournamentsStickyToolbarProps {
  formatId: FormatId;
  modeId: ModeId;
  filters: TournamentFiltersState;
  onFiltersChange: (filters: TournamentFiltersState) => void;
  resultCount: number;
  totalCount: number;
  /** Layout dedicato mobile: selettori a pillola, niente morph da card. */
  mobile?: boolean;
}

function ToolbarSectionLabel({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      className="tournaments-toolbar-section-collapse"
      data-open={open ? 'true' : 'false'}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <h2 className="pb-0 font-sans text-xs font-bold uppercase tracking-widest text-white/50">
          {children}
        </h2>
      </div>
    </div>
  );
}

/** Formato, modalità e filtri: sticky sotto l'header, compatti durante lo scroll. */
export function TournamentsStickyToolbar({
  formatId,
  modeId,
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
  mobile = false,
}: TournamentsStickyToolbarProps) {
  const [compact, setCompact] = useState(false);
  const [settleAnim, setSettleAnim] = useState<'compact' | 'expand' | null>(null);
  const compactRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prev = compactRef.current;
      let next = prev;

      if (!prev && y > SCROLL_COMPACT_ON) next = true;
      else if (prev && y < SCROLL_COMPACT_OFF) next = false;

      if (next !== prev) {
        compactRef.current = next;
        setCompact(next);
        setSettleAnim(next ? 'compact' : 'expand');
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!settleAnim) return;
    const timer = window.setTimeout(() => setSettleAnim(null), 350);
    return () => window.clearTimeout(timer);
  }, [settleAnim]);

  return (
    <div className="sticky top-2 z-50 isolate">
      <div
        data-compact={compact ? 'true' : 'false'}
        className={cn(
          'tournaments-toolbar-ease mx-auto max-w-content text-white',
          settleAnim === 'compact' && 'animate-toolbar-compact-settle',
          settleAnim === 'expand' && 'animate-toolbar-expand-settle',
          // Sempre pannello scuro: da espansa era trasparente, ma sul nuovo
          // sfondo chiaro etichette e filtri bianchi sparivano.
          // Niente backdrop-blur: a /95+ di opacità non si vede e costa un
          // re-blur del contenuto sottostante a ogni frame di scroll.
          compact
            ? 'rounded-3xl border border-white/15 bg-[#27407a]/95 px-4 py-3.5 shadow-[0_14px_36px_-14px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/[0.06] sm:px-5'
            : 'rounded-3xl border border-white/[0.08] bg-header-bg/95 px-4 py-4 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.35)] sm:px-5',
        )}
      >
        {mobile ? (
          <div className="flex w-full flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span
                id="tornei-format-label"
                className="w-[4.5rem] shrink-0 font-sans text-[10px] font-bold uppercase tracking-wider text-white/45"
              >
                Formato
              </span>
              <div className="min-w-0 flex-1">
                <FormatSelectorGrid
                  selectedFormatId={formatId}
                  currentModeId={modeId}
                  mobile
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-[4.5rem] shrink-0 font-sans text-[10px] font-bold uppercase tracking-wider text-white/45">
                Modalità
              </span>
              <div className="min-w-0 flex-1">
                <ModeSelectorRow
                  selectedModeId={modeId}
                  currentFormatId={formatId}
                  mobile
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-2.5">
              <TournamentFilters
                filters={filters}
                onChange={onFiltersChange}
                resultCount={resultCount}
                totalCount={totalCount}
                mobile
              />
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'flex w-full flex-col transition-[gap] items-center',
              TOOLBAR_MORPH_EASE,
              compact ? 'gap-3' : 'gap-6',
            )}
          >
            <section
              className={cn(
                'flex w-full flex-col items-center transition-[gap]',
                TOOLBAR_MORPH_EASE,
                compact ? 'gap-2' : 'gap-3',
              )}
            >
              <ToolbarSectionLabel open={!compact}>Formato</ToolbarSectionLabel>
              <FormatSelectorGrid
                selectedFormatId={formatId}
                currentModeId={modeId}
                compact={compact}
              />
            </section>

            <section
              className={cn(
                'flex w-full flex-col items-center transition-[gap]',
                TOOLBAR_MORPH_EASE,
                compact ? 'gap-2 border-t border-white/10 pt-3' : 'gap-3',
              )}
            >
              <ToolbarSectionLabel open={!compact}>Modalità</ToolbarSectionLabel>
              <ModeSelectorRow
                selectedModeId={modeId}
                currentFormatId={formatId}
                compact={compact}
              />
            </section>

            <div
              className={cn(
                'w-full transition-[border-color,padding]',
                TOOLBAR_MORPH_EASE,
                compact && 'border-t border-white/10 pt-3',
              )}
            >
              <TournamentFilters
                filters={filters}
                onChange={onFiltersChange}
                resultCount={resultCount}
                totalCount={totalCount}
                compact={compact}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
