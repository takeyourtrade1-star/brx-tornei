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
}: ModeSelectorRowProps) {
  const router = useRouter();
  const headsUp = MODES.find((mode) => mode.id === 'heads-up')!;
  const multiplayer = MODES.find((mode) => mode.id === 'multiplayer')!;

  const selectMode = (modeId: ModeId, available: boolean) => {
    if (!available || modeId === selectedModeId) return;
    router.replace(`/tornei?format=${currentFormatId}&mode=${modeId}`, { scroll: false });
  };

  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-md shadow-sm">
      <ModeCard
        title={headsUp.name}
        description={headsUp.description}
        icon={Swords}
        selected={selectedModeId === headsUp.id}
        available
        onSelect={() => selectMode(headsUp.id, true)}
      />
      <ModeCard
        title={multiplayer.name}
        description={multiplayer.description}
        icon={Users}
        selected={selectedModeId === multiplayer.id}
        available={multiplayer.available}
        badge={multiplayer.badge}
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
  onSelect: () => void;
}

function ModeCard({
  title,
  description,
  icon: Icon,
  selected,
  available,
  badge,
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
        'flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 transition-all duration-200 sm:px-3',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-inset',
        selected && available
          ? 'border-white/25 bg-gradient-to-r from-[#FF7300] to-[#e0564d] text-white shadow-md ring-1 ring-white/30 backdrop-blur-md'
          : 'border-transparent bg-transparent text-white/70 hover:bg-white/10 hover:text-white',
        !available && 'cursor-not-allowed opacity-60',
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
        <span className="inline-flex shrink-0 items-center rounded-full bg-white/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-amber-300 ring-1 ring-white/15 sm:text-[8px]">
          {badge}
        </span>
      )}
    </button>
  );
}