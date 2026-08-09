'use client';

import { useRouter } from 'next/navigation';
import { Check, Swords, Users, type LucideIcon } from 'lucide-react';
import { MODES, type ModeId } from '@/lib/data/catalog';
import type { FormatFilter } from '@/lib/validations/selection';
import { cn } from '@/lib/utils';

interface ModeSelectorRowProps {
  selectedModeId: ModeId;
  currentFormatId: FormatFilter;
  compact?: boolean;
  /** Pannello chiaro (lobby desktop): segmenti bianchi su sfondo chiaro. */
  lightPanel?: boolean;
  /** Layout mobile: due controlli identici e sempre affiancati. */
  mobile?: boolean;
}

/** Tipo di partita come controllo segmentato sottile: poco invasivo. */
export function ModeSelectorRow({
  selectedModeId,
  currentFormatId,
  lightPanel = false,
}: ModeSelectorRowProps) {
  const router = useRouter();
  const headsUp = MODES.find((mode) => mode.id === 'heads-up')!;
  const multiplayer = MODES.find((mode) => mode.id === 'multiplayer')!;

  const selectMode = (modeId: ModeId, available: boolean) => {
    if (!available || modeId === selectedModeId) return;
    router.replace(`/tornei?format=${currentFormatId}&mode=${modeId}`, { scroll: false });
  };

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-1 rounded-full p-1',
        lightPanel
          ? 'bg-white shadow-[0_2px_12px_-6px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/[0.07]'
          : 'bg-black/20 ring-1 ring-white/10',
      )}
    >
      <ModeCard
        title={headsUp.name}
        description={headsUp.description}
        icon={Swords}
        selected={selectedModeId === headsUp.id}
        available
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
  lightPanel,
  onSelect,
}: ModeCardProps) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onSelect}
      aria-pressed={selected}
      title={description}
      className={cn(
        'flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 transition-colors duration-200 sm:px-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-inset',
        selected && available
          ? lightPanel
            ? 'border-primary/20 bg-white/70 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_-8px_rgba(255,115,0,0.35)] ring-1 ring-primary/20 backdrop-blur-md'
            : 'border-white/15 bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] ring-1 ring-inset ring-white/25 backdrop-blur-md'
          : lightPanel
            ? 'border-transparent text-slate-500 hover:border-slate-900/[0.08] hover:bg-slate-100 hover:text-header-bg'
            : 'border-transparent bg-transparent text-white/55 hover:bg-white/[0.07] hover:text-white',
        !available && 'cursor-not-allowed opacity-70',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate text-[11px] font-black uppercase tracking-wide sm:text-xs">
        {title}
      </span>
      {selected && available && (
        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={3.5} aria-hidden="true" />
      )}
      {badge && !selected && (
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider sm:text-[8px]',
            lightPanel
              ? 'bg-amber-100 text-amber-700'
              : 'bg-white/10 text-amber-300 ring-1 ring-white/15',
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}