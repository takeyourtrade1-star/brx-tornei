'use client';

import { useRouter } from 'next/navigation';
import { Check, Swords, Users, type LucideIcon } from 'lucide-react';
import { MODES, type ModeId } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

interface ModeSelectorRowProps {
  selectedModeId: ModeId;
  currentFormatId: string;
  compact?: boolean;
  lightPanel?: boolean;
  /** Layout mobile: due controlli identici e sempre affiancati. */
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
  const dense = compact || mobile;
  const headsUp = MODES.find((mode) => mode.id === 'heads-up')!;
  const multiplayer = MODES.find((mode) => mode.id === 'multiplayer')!;

  const selectMode = (modeId: ModeId, available: boolean) => {
    if (!available || modeId === selectedModeId) return;
    router.replace(`/tornei?format=${currentFormatId}&mode=${modeId}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-2 sm:gap-3',
        !dense && 'max-w-3xl',
      )}
    >
      <ModeCard
        title={headsUp.name}
        description={headsUp.description}
        icon={Swords}
        selected={selectedModeId === headsUp.id}
        available
        dense={dense}
        lightPanel={lightPanel}
        onSelect={() => selectMode(headsUp.id, true)}
      />
      <ModeCard
        title={multiplayer.name}
        description={multiplayer.description}
        icon={Users}
        selected={selectedModeId === multiplayer.id}
        available={multiplayer.available}
        badge={multiplayer.badge}
        dense={dense}
        lightPanel={lightPanel}
        onSelect={() => selectMode(multiplayer.id, multiplayer.available)}
      />
    </div>
  );
}

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  selected: boolean;
  available: boolean;
  badge?: string;
  dense: boolean;
  lightPanel: boolean;
  onSelect: () => void;
}

function ModeCard({
  title,
  description,
  icon: Icon,
  selected,
  available,
  badge,
  dense,
  lightPanel,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full items-center border text-left transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-header-bg',
        dense ? 'min-h-11 gap-2 rounded-xl px-2.5 py-2' : 'min-h-[4.75rem] gap-3 rounded-2xl px-4 py-3',
        selected && available
          ? 'border-primary/70 bg-gradient-to-r from-primary/25 to-primary/10 text-white shadow-[0_12px_30px_-18px_rgba(255,115,0,0.95)] ring-1 ring-primary/30'
          : lightPanel
            ? 'border-slate-900/10 bg-white/70 text-header-bg hover:border-primary/30 hover:bg-white'
            : 'border-white/10 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]',
        !available && 'cursor-not-allowed opacity-55',
      )}
    >
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl transition-colors',
          dense ? 'h-8 w-8' : 'h-10 w-10',
          selected && available
            ? 'bg-primary text-white'
            : lightPanel
              ? 'bg-header-bg text-white'
              : 'bg-white/10 text-white/70',
        )}
      >
        <Icon className={dense ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn('truncate font-black uppercase tracking-wide', dense ? 'text-[10px] sm:text-xs' : 'text-sm')}>
            {title}
          </span>
          {badge && (
            <span className="hidden shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-marquee sm:inline">
              {badge}
            </span>
          )}
        </span>
        {!dense && (
          <span className={cn('mt-1 block truncate text-xs font-semibold', lightPanel ? 'text-slate-500' : 'text-white/55')}>
            {description}
          </span>
        )}
      </span>

      {selected && available && (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
