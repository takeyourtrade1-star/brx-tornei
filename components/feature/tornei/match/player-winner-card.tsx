'use client';

import { Trophy, Check } from 'lucide-react';
import type { ProfileAvatar } from '@/lib/avatars';
import { cn } from '@/lib/utils';

export interface PlayerWinnerCardProps {
  isMe: boolean;
  title: string;
  subtitle?: string;
  badge: string;
  avatar: ProfileAvatar;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * Card contendente per la dichiarazione del vincitore (MatchDeclareModal).
 * Stile liquid glass arancione con riflessi in vetro, indicatore di selezione e glow.
 */
export function PlayerWinnerCard({
  title,
  subtitle,
  badge,
  avatar,
  selected,
  disabled,
  onSelect,
}: PlayerWinnerCardProps) {
  const AvatarIcon = avatar.icon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-center justify-between gap-3.5 overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/[0.18] shadow-[0_0_30px_rgba(255,115,0,0.3)] ring-2 ring-primary/80'
          : 'border-white/15 bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-primary/60 hover:bg-white/[0.08] hover:shadow-[0_0_25px_rgba(255,115,0,0.25)] hover:-translate-y-0.5',
      )}
    >
      {/* Liquid Glass Highlight: riflesso superiore in vetro */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity group-hover:via-primary/70"
      />

      {/* Glow d'angolo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-primary/10 blur-xl transition-all duration-300 group-hover:scale-125 group-hover:bg-primary/25"
      />

      {/* Avatar del giocatore + info */}
      <div className="flex min-w-0 items-center gap-3.5">
        <div
          className={cn(
            'relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/20 bg-gradient-to-b from-slate-900 via-header-bg to-black p-1 shadow-inner transition-colors group-hover:border-primary/60',
            avatar.bgGradient,
          )}
        >
          <AvatarIcon
            className={cn(
              'h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:scale-110',
              avatar.color,
            )}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="truncate font-display text-base font-black text-white sm:text-lg">
              {title}
            </span>
            {subtitle && (
              <span className="truncate text-xs font-bold text-white/50">
                {subtitle}
              </span>
            )}
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider text-primary transition-colors group-hover:text-amber-300">
            {badge}
          </span>
        </div>
      </div>

      {/* Icona o indicatore di selezione */}
      <div
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-all duration-200',
          selected
            ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(255,115,0,0.6)]'
            : 'border-white/15 bg-white/5 text-white/40 group-hover:border-primary/50 group-hover:bg-primary/20 group-hover:text-white',
        )}
      >
        {selected ? <Check className="h-4 w-4 stroke-[3]" /> : <Trophy className="h-4 w-4" />}
      </div>
    </button>
  );
}
