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
        title="Torneo"
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
          ? 'h-7 shrink-0 gap-1.5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wide ring-1'
          : 'h-14 min-h-14 w-full gap-3 rounded-xl border px-4 sm:h-16 sm:min-h-16 sm:flex-1',
        compact && available && (lightPanel ? 'hover:bg-black/8' : 'hover:bg-white/10'),
        compact &&
          selected &&
          available &&
          'bg-primary/20 text-primary ring-primary/40',
        compact &&
          !selected &&
          available &&
          (lightPanel
            ? 'bg-black/[0.06] text-slate-600 ring-black/10 hover:text-slate-800'
            : 'bg-white/5 text-white/65 ring-white/10'),
        compact &&
          !available &&
          (lightPanel
            ? 'cursor-not-allowed bg-black/[0.04] text-slate-400 ring-black/10'
            : 'cursor-not-allowed bg-white/[0.02] text-white/35 ring-white/10'),
        !compact && available && 'hover:border-primary/40 hover:bg-white/[0.06]',
        !compact && selected && available && 'border-primary/60 bg-primary/10 ring-1 ring-primary/30',
        !compact && !selected && available && 'border-white/15 bg-white/[0.03]',
        !compact && !available && 'cursor-not-allowed border-white/10 bg-white/[0.02] opacity-55',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          compact
            ? 'h-3 w-3'
            : cn(
                'h-9 w-9 rounded-lg',
                selected && available ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/70',
              ),
        )}
      >
        <Icon className={cn('transition-all duration-500', compact ? 'h-3 w-3' : 'h-4 w-4')} />
      </span>
      <span className={cn('min-w-0 flex-1', compact && 'flex items-center gap-1')}>
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
                'shrink-0 rounded-full bg-white/10 font-bold uppercase text-marquee transition-all duration-500',
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
            'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            compact ? 'grid-rows-[0fr] opacity-0' : 'mt-0.5 grid-rows-[1fr] opacity-100',
          )}
        >
          <span className="block truncate text-xs text-white/50">{description}</span>
        </span>
      </span>
    </button>
  );
}
