'use client';

import { Lock } from 'lucide-react';
import { GAME_AVATARS } from '@/lib/avatars';
import { getRequiredQualifyingMatches } from '@/lib/cosmetic-unlocks';
import { cn } from '@/lib/utils';

interface OnboardingAvatarPickerProps {
  selectedAvatarId: string;
  qualifyingMatches: number;
  onSelect: (id: string) => void;
}

/** Scelta avatar dell'onboarding con la stessa progressione del profilo. */
export function OnboardingAvatarPicker({
  selectedAvatarId,
  qualifyingMatches,
  onSelect,
}: OnboardingAvatarPickerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
          Scegli il tuo avatar
        </label>
        <span className="text-right text-[10px] text-slate-500">3 iniziali · +1 ogni 5 partite</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {GAME_AVATARS.map((avatar, index) => {
          const Icon = avatar.icon;
          const isSelected = avatar.id === selectedAvatarId;
          const requiredMatches = getRequiredQualifyingMatches(index);
          const unlocked = qualifyingMatches >= requiredMatches;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.id)}
              title={unlocked
                ? `${avatar.name} (${avatar.subtitle})`
                : `${avatar.name}: servono ${requiredMatches} partite da almeno 30 minuti`}
              aria-label={unlocked
                ? `Seleziona avatar ${avatar.name}`
                : `Avatar ${avatar.name} bloccato: servono ${requiredMatches} partite da almeno 30 minuti`}
              disabled={!unlocked}
              className={cn(
                'group relative grid aspect-square place-items-center rounded-xl border p-1.5 transition-all disabled:cursor-not-allowed',
                isSelected
                  ? 'scale-105 border-primary bg-primary/10 shadow-sm ring-2 ring-primary/40'
                  : unlocked
                    ? 'border-slate-200 bg-slate-50/50 hover:scale-105 hover:border-slate-300 hover:bg-slate-100'
                    : 'border-slate-200 bg-slate-100 opacity-50 grayscale',
              )}
            >
              <Icon className="h-6 w-6 transition-transform group-hover:scale-110 sm:h-7 sm:w-7" />
              {!unlocked && (
                <span className="absolute bottom-0.5 right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-slate-900 text-white">
                  <Lock className="h-2 w-2" aria-hidden />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500">Valgono solo le partite durate almeno 30 minuti.</p>
    </div>
  );
}
