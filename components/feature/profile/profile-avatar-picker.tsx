'use client';

import { ChevronDown, Lock } from 'lucide-react';
import { GAME_AVATARS, getAvatarById } from '@/lib/avatars';
import {
  getRequiredQualifyingMatches,
  getUnlockedCosmeticCount,
} from '@/lib/cosmetic-unlocks';
import { cn } from '@/lib/utils';

interface ProfileAvatarPickerProps {
  selectedAvatarId: string;
  onSelectAvatar: (id: string) => void;
  open: boolean;
  onToggle: () => void;
  qualifyingMatches: number;
}

/** Sezione collassabile per la selezione dell'avatar di gioco. */
export function ProfileAvatarPicker({
  selectedAvatarId,
  onSelectAvatar,
  open,
  onToggle,
  qualifyingMatches,
}: ProfileAvatarPickerProps) {
  const activeAvatar = getAvatarById(selectedAvatarId);
  const SelectedIcon = activeAvatar.icon;
  const unlockedCount = getUnlockedCosmeticCount(GAME_AVATARS.length, qualifyingMatches);

  return (
    <section className="mb-4 rounded-2xl border border-slate-300 bg-slate-50/90 p-3.5 shadow-sm transition-all">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white p-1 border border-slate-300 shadow-sm">
            <SelectedIcon className="h-6 w-6" />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Avatar di gioco</h3>
            <p className="text-[10px] font-bold text-slate-400">
              {unlockedCount} di {GAME_AVATARS.length} sbloccati · {activeAvatar.name}
            </p>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-3.5 grid grid-cols-5 gap-2 border-t border-slate-300 pt-3 animate-in fade-in-50 duration-200">
          {GAME_AVATARS.map((avatar, index) => {
            const Icon = avatar.icon;
            const isSelected = avatar.id === selectedAvatarId;
            const requiredMatches = getRequiredQualifyingMatches(index);
            const unlocked = qualifyingMatches >= requiredMatches;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelectAvatar(avatar.id)}
                title={unlocked
                  ? `${avatar.name} (${avatar.subtitle})`
                  : `${avatar.name}: si sblocca con ${requiredMatches} partite da almeno 30 minuti`}
                aria-label={unlocked
                  ? `Seleziona avatar ${avatar.name}`
                  : `Avatar ${avatar.name} bloccato: servono ${requiredMatches} partite da almeno 30 minuti`}
                disabled={!unlocked}
                className={cn(
                  'group relative grid aspect-square place-items-center rounded-xl border p-2 transition-all bg-white shadow-sm disabled:cursor-not-allowed',
                  isSelected
                    ? 'border-amber-500 bg-amber-50/70 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/70 scale-105'
                    : !unlocked
                      ? 'border-slate-300 bg-slate-100 opacity-55 grayscale'
                    : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50 hover:scale-105',
                )}
              >
                <Icon className="h-7 w-7 transition-transform duration-200 group-hover:scale-110 sm:h-8 sm:w-8" />
                {!unlocked && (
                  <span className="absolute bottom-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-slate-900 text-white shadow">
                    <Lock className="h-2.5 w-2.5" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {open && unlockedCount < GAME_AVATARS.length && (
        <p className="mt-2 text-[10px] font-semibold text-slate-500">
          Una nuova icona ogni 5 partite giocate per almeno 30 minuti.
        </p>
      )}
    </section>
  );
}
