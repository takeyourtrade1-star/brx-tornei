'use client';

import { useRouter } from 'next/navigation';
import { MODES, type ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';
import { Swords, Users } from 'lucide-react';

const MODE_MORPH_EASE =
  'transition-[height,flex-grow,padding,border-radius,gap,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0';

interface ModeSelectorRowProps {
  selectedModeId: ModeId;
  currentFormatId: string;
  compact?: boolean;
  lightPanel?: boolean;
  /** Layout dedicato mobile: due pillole affiancate. */
  mobile?: boolean;
}

export function ModeSelectorRow({
  selectedModeId,
  currentFormatId,
  compact = false,
  lightPanel = false,
  mobile = false,
}: ModeSelectorRowProps) {
  const router = useRouter();

  const headsUp = MODES.find((m) => m.id === 'heads-up')!;
  const torneo = MODES.find((m) => m.id === 'multiplayer')!;

  const selectMode = (modeId: ModeId, available: boolean) => {
    if (!available || modeId === selectedModeId) return;
    router.replace(`/tornei?format=${currentFormatId}&mode=${modeId}`, { scroll: false });
  };

  // Mobile: due pillole affiancate a larghezza piena.
  if (mobile) {
    return (
      <div className="flex w-full gap-2">
        <ModePill
          title={headsUp.name}
          icon={Swords}
          selected={selectedModeId === 'heads-up'}
          available
          onSelect={() => selectMode('heads-up', true)}
        />
        <ModePill
          title={torneo.name}
          icon={Users}
          selected={selectedModeId === 'multiplayer'}
          available={torneo.available}
          onSelect={() => selectMode('multiplayer', torneo.available)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full items-center justify-center transition-[gap] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:duration-0',
        compact ? 'flex-wrap gap-1.5' : 'flex-col gap-2 sm:flex-row sm:gap-3',
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

interface ModePillProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  selected: boolean;
  available: boolean;
  onSelect: () => void;
}

/** Pillola modalità per il layout mobile. */
function ModePill({ title, icon: Icon, selected, available, onSelect }: ModePillProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'simple-pill flex h-9 flex-1 items-center justify-center gap-1.5 px-3',
        'text-[11px] font-bold uppercase tracking-wide',
        !available
          ? 'cursor-not-allowed bg-white/[0.03] text-white/55 ring-1 ring-white/10'
          : selected
            ? 'simple-pill-active'
            : 'simple-pill-inactive',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{title}</span>
    </button>
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
          ? 'h-8 shrink-0 grow-0 basis-0 gap-2 rounded-full border border-transparent px-3 text-[11px] font-bold uppercase tracking-wide'
          : 'h-14 min-h-14 w-full gap-3 rounded-3xl border border-white/[0.06] bg-white/[0.03] px-4 sm:h-16 sm:min-h-16 sm:basis-0 sm:grow-[0.5]',
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
          'flex shrink-0 items-center justify-center transition-[width,height,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          compact ? 'h-3 w-3' : 'h-6 w-6',
          !compact && selected && available && 'text-primary',
          !compact && !(selected && available) && 'text-white/60',
        )}
      >
        <Icon className={cn('transition-[width,height] duration-300', compact ? 'h-3 w-3' : 'h-5 w-5')} />
      </span>
      <span className={cn('min-w-0', compact ? 'flex shrink-0 items-center gap-1' : 'flex-1')}>
        <span className={cn('flex items-center', compact ? 'gap-1' : 'gap-2')}>
          <span
            className={cn(
              'truncate font-bold uppercase tracking-wide transition-[font-size,color] duration-300',
              compact ? 'text-[10px]' : 'font-sans text-sm text-white',
            )}
          >
            {title}
          </span>
          {badge && (
            <span
              className={cn(
                'shrink-0 rounded-full bg-white/[0.06] font-bold uppercase text-marquee transition-[font-size,padding] duration-300',
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
            'overflow-hidden transition-[grid-template-rows,opacity,margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            compact
              ? 'grid w-0 grid-rows-[0fr] opacity-0'
              : 'mt-0.5 grid w-full grid-rows-[1fr] opacity-100',
          )}
        >
          <span className="block truncate text-xs text-white/55">{description}</span>
        </span>
      </span>
    </button>
  );
}
