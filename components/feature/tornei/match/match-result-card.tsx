'use client';

import { Trophy } from 'lucide-react';
import type { getAvatarForPlayer } from '@/lib/avatars';
import { cn } from '@/lib/utils';

export interface MatchResultCardProps {
  name: string;
  isMe: boolean;
  scoreDisplay: string;
  avatar: ReturnType<typeof getAvatarForPlayer>;
  disabled?: boolean;
  onSelect: () => void;
}

/**
 * Card giocatore per la selezione del risultato nel modale.
 * Dispone chiaramente l'identità del giocatore, l'esito e il punteggio
 * in una pill dedicata evitando qualsiasi ritorno a capo anomalo.
 */
export function MatchResultCard({
  name,
  isMe,
  scoreDisplay,
  avatar,
  disabled,
  onSelect,
}: MatchResultCardProps) {
  const AvatarIcon = avatar.icon;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-2xl border p-3.5 text-left backdrop-blur-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        'border-white/15 bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
        'hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/[0.18] hover:via-amber-500/[0.08] hover:to-white/[0.05] hover:shadow-[0_0_25px_rgba(255,115,0,0.3)] hover:-translate-y-0.5',
      )}
    >
      {/* Riflesso superiore in vetro */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity group-hover:via-primary/70"
      />

      {/* Glow nell'angolo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 h-20 w-20 rounded-full bg-primary/10 blur-xl transition-all duration-300 group-hover:scale-125 group-hover:bg-primary/25"
      />

      {/* Identità: Avatar + Nome + Etichetta */}
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            'relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-gradient-to-b from-slate-900 via-header-bg to-black p-1 shadow-inner transition-colors group-hover:border-primary/60',
            avatar.bgGradient,
          )}
        >
          <AvatarIcon
            className={cn(
              'h-6 w-6 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:scale-110',
              avatar.color,
            )}
          />
        </div>

        <div className="min-w-0">
          <span className="block truncate font-display text-sm font-black text-white">
            {name}
          </span>
          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-primary transition-colors group-hover:text-amber-300">
            {isMe ? 'Vittoria mia' : 'Vittoria avversario'}
          </span>
        </div>
      </div>

      {/* Pill Punteggio + Trofeo allineati a destra */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5 shadow-inner transition-colors group-hover:border-primary/40 group-hover:bg-primary/15">
          <Trophy className="h-3 w-3 text-primary transition-colors group-hover:text-amber-300" />
          <span className="font-display text-xs font-black tabular-nums tracking-widest text-white transition-colors group-hover:text-amber-200">
            {scoreDisplay}
          </span>
        </div>
      </div>
    </button>
  );
}
