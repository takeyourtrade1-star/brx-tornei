'use client';

import { useRouter } from 'next/navigation';
import { MODES, type ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import { Swords, Users } from 'lucide-react';

const MODE_MORPH_EASE =
  'transition-[height,padding,border-radius,gap,background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

interface ModeSelectorRowProps {
  selectedModeId: ModeId;
  currentFormatId: string;
  compact?: boolean;
  lightPanel?: boolean;
}

export function ModeSelectorRow({
  selectedModeId,
  currentFormatId,
  compact = false,
  lightPanel = false,
}: ModeSelectorRowProps) {
  const router = useRouter();

  const headsUp = MODES.find((m) => m.id === 'heads-up')!;
  const torneo = MODES.find((m) => m.id === 'multiplayer')!;

  const selectMode = (modeId: ModeId, available: boolean) => {
    if (!available || modeId === selectedModeId) return;
    router.replace(`/tornei?format=${currentFormatId}&mode=${modeId}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        'flex w-full transition-[gap,flex-direction] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
        compact
          ? 'flex-wrap items-center justify-center gap-1.5'
          : 'flex-col gap-2 sm:flex-row sm:gap-3',
      )}
    >
      <ModeCard
        title={headsUp.name}
        description={headsUp.description}
        icon={Swords}
        selected={selectedModeId === 'heads-up'}
        available
        compact={compact}
        lightPanel={lightPanel}
        onSelect={() => selectMode('heads-up', true)}
      />
      <ModeCard
        title={torneo.name}
        description={torneo.description}
        icon={Users}
        selected={selectedModeId === 'multiplayer'}
        available={torneo.available}
        badge={torneo.badge}
        compact={compact}
        lightPanel={lightPanel}
        onSelect={() => selectMode('multiplayer', torneo.available)}
      />
    </div>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  selected: boolean;
  available: boolean;
  badge?: string;
  compact?: boolean;
  lightPanel?: boolean;
  onSelect: () => void;
}

function ModeCard({
  title,
  description,
  icon: Icon,
  selected,
  available,
  badge,
  compact = false,
  lightPanel = false,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex items-center text-left',
        MODE_MORPH_EASE,
        compact
          ? 'simple-pill h-8 shrink-0 gap-2 px-3 text-[11px] font-bold uppercase tracking-wide'
          : 'h-14 min-h-14 w-full gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] px-4 transition-colors sm:h-16 sm:min-h-16 sm:flex-1',
        compact && selected && available && 'simple-pill-active',
        compact && !selected && available && 'simple-pill-inactive',
        compact && !available && 'cursor-not-allowed bg-white/[0.03] text-white/35 ring-white/10',
        !compact && available && 'hover:border-white/[0.12] hover:bg-white/[0.05]',
        !compact && selected && available && 'border-primary/30 bg-primary/[0.08]',
        !compact && !available && 'cursor-not-allowed border-white/[0.04] bg-white/[0.02] opacity-50',
      )}
    >
        <span
        className={cn(
          'flex shrink-0 items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          compact ? 'h-3 w-3' : 'h-6 w-6',
          !compact && selected && available && 'text-primary',
          !compact && !(selected && available) && 'text-white/60',
        )}
      >
        <Icon className={cn('transition-all duration-500', compact ? 'h-3 w-3' : 'h-5 w-5')} />
      </span>
      <span className={cn('min-w-0', compact ? 'flex shrink-0 items-center gap-1' : 'flex-1')}>
        <span className={cn('flex items-center', compact ? 'gap-1' : 'gap-2')}>
          <span
            className={cn(
              'truncate font-bold uppercase tracking-wide transition-all duration-500',
              compact ? 'text-[10px]' : 'font-sans text-sm text-white',
            )}
          >
            {title}
          </span>
          {badge && (
            <span
              className={cn(
                'shrink-0 rounded-full bg-white/[0.06] font-bold uppercase text-marquee transition-all duration-500',
                compact
                  ? 'px-1.5 py-px text-[8px]'
                  : 'px-2 py-0.5 text-[10px] tracking-wider',
              )}
            >
              {badge}
            </span>
          )}
        </span>
        <span
          className={cn(
            'overflow-hidden transition-[grid-template-rows,opacity,margin,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            compact
              ? 'grid h-0 w-0 grid-rows-[0fr] opacity-0'
              : 'mt-0.5 grid w-full grid-rows-[1fr] opacity-100',
          )}
        >
          <span className="block truncate text-xs text-white/55">{description}</span>
        </span>
      </span>
    </button>
  );
}
