'use client';

import { ChevronDown } from 'lucide-react';
import { GAME_AVATARS, getAvatarById } from '@/lib/avatars';
import { cn } from '@/lib/utils';

interface ProfileAvatarPickerProps {
  selectedAvatarId: string;
  onSelectAvatar: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}

/** Sezione collassabile per la selezione dell'avatar di gioco. */
export function ProfileAvatarPicker({
  selectedAvatarId,
  onSelectAvatar,
  open,
  onToggle,
}: ProfileAvatarPickerProps) {
  const activeAvatar = getAvatarById(selectedAvatarId);
  const SelectedIcon = activeAvatar.icon;

  return (
    <section className="mb-4 rounded-2xl border border-slate-900/[0.08] bg-slate-50/80 p-3.5 transition-all">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-900/[0.08]">
            <SelectedIcon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Avatar di gioco</h3>
            <p className="text-[10px] font-bold text-slate-400">
              Selezionato: <span className="text-slate-700 font-extrabold">{activeAvatar.name}</span>
            </p>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-3.5 grid grid-cols-5 gap-2 border-t border-slate-900/[0.06] pt-3 animate-in fade-in-50 duration-200">
          {GAME_AVATARS.map((avatar) => {
            const Icon = avatar.icon;
            const isSelected = avatar.id === selectedAvatarId;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelectAvatar(avatar.id)}
                title={`${avatar.name} (${avatar.subtitle})`}
                aria-label={`Seleziona avatar ${avatar.name}`}
                className={cn(
                  'group relative grid aspect-square place-items-center rounded-xl border p-2 transition-all bg-white shadow-sm',
                  isSelected
                    ? 'border-amber-500 bg-amber-50/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] ring-2 ring-amber-400/60 scale-105'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 hover:scale-105',
                )}
              >
                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
