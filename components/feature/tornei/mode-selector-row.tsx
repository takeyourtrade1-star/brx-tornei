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
        'grid w-full grid-cols-2',
        lightPanel ? 'gap-3' : 'gap-1.5 rounded-2xl border border-white/10 bg-black/25 p-1.5 shadow-inner shadow-black/30',
        !dense && !lightPanel && 'max-w-3xl',
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
        'group relative isolate flex w-full items-center overflow-hidden border text-left transition duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        lightPanel
          ? 'min-h-[4.25rem] gap-3 rounded-2xl border px-3.5 py-2 active:scale-[0.99]'
          : dense
            ? 'min-h-11 gap-2 rounded-xl px-2.5 py-2'
            : 'min-h-[4.75rem] gap-3 rounded-xl px-4 py-3',
        selected && available
          ? lightPanel
            ? 'border-primary/60 bg-white text-header-bg shadow-[0_10px_28px_-14px_rgba(255,115,0,0.4)] ring-1 ring-primary/25'
            : 'border-white/25 bg-gradient-to-br from-white/20 via-white/10 to-white/[0.04] text-white shadow-lg shadow-black/20 ring-1 ring-inset ring-white/10'
          : lightPanel
            ? 'border-slate-900/[0.08] bg-white text-header-bg shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:-translate-y-0.5 hover:border-slate-900/[0.18] hover:shadow-[0_12px_30px_-14px_rgba(15,23,42,0.22)]'
            : 'border-transparent bg-transparent text-white hover:border-white/10 hover:bg-white/[0.06]',
        !available && 'cursor-not-allowed opacity-55',
      )}
    >
      {selected && available && !lightPanel && (
        <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" aria-hidden="true" />
      )}
      <span
        className={cn(
          'grid shrink-0 place-items-center rounded-xl transition-colors',
          dense && !lightPanel ? 'h-8 w-8' : 'h-10 w-10',
          selected && available
            ? lightPanel
              ? 'bg-gradient-to-br from-[#FF7300] to-[#e0564d] text-white shadow-[0_6px_16px_-4px_rgba(255,115,0,0.45)]'
              : 'bg-white/10 text-primary ring-1 ring-white/15'
            : lightPanel
              ? 'bg-slate-100 text-slate-500 group-hover:bg-header-bg group-hover:text-white'
              : 'bg-white/10 text-white/70',
        )}
      >
        <Icon className={dense && !lightPanel ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'truncate font-black uppercase tracking-wide',
              dense && !lightPanel ? 'text-[10px] sm:text-xs' : lightPanel ? 'text-sm' : 'text-sm',
            )}
          >
            {title}
          </span>
          {badge && (
            <span className={cn(
              'hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider sm:inline',
              lightPanel ? 'bg-amber-100 text-amber-700' : 'bg-white/10 text-marquee',
            )}>
              {badge}
            </span>
          )}
        </span>
        {!dense && (
          <span className={cn('mt-0.5 block truncate text-xs font-semibold', lightPanel ? 'text-slate-500' : 'text-white/55')}>
            {description}
          </span>
        )}
        {lightPanel && dense && (
          <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">
            {description}
          </span>
        )}
      </span>

      {selected && available && (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white shadow-sm">
          <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
        </span>
      )}
    </button>
  );
}
