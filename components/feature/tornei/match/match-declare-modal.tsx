'use client';

import { Trophy, X } from 'lucide-react';
import { getAvatarForPlayer, type ProfileAvatar } from '@/lib/avatars';
import { cn } from '@/lib/utils';

export interface MatchDeclareModalProps {
  open: boolean;
  localName: string;
  opponentName: string;
  busy?: boolean;
  onDeclare: (iWon: boolean) => void;
  onClose: () => void;
}

/**
 * Modale di dichiarazione esito partita con card giocatori in stile liquid glass arancione.
 */
export function MatchDeclareModal({
  open,
  localName,
  opponentName,
  busy = false,
  onDeclare,
  onClose,
}: MatchDeclareModalProps) {
  if (!open) return null;

  const myAvatar = getAvatarForPlayer(localName, true);
  const oppAvatar = getAvatarForPlayer(opponentName, false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Termina partita: chi ha vinto?"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-[#161d36]/95 via-[#0c1226]/95 to-[#060a16]/98 p-6 sm:p-8 text-center text-white shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10">
        {/* Glow ambientale arancione sullo sfondo del modale */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full bg-primary/20 blur-3xl"
        />

        {/* Bottone di chiusura rapida */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Chiudi modale"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-white/50 transition hover:border-white/25 hover:bg-white/15 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Badge Trofeo Superiore */}
        <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/25 via-amber-500/15 to-transparent text-primary shadow-[0_0_30px_rgba(255,115,0,0.35)] backdrop-blur-md">
          <Trophy className="h-8 w-8 drop-shadow-[0_2px_8px_rgba(255,115,0,0.8)]" />
        </div>

        {/* Titolo e Spiegazione */}
        <h2 className="mt-4 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
          Chi ha vinto?
        </h2>
        <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-white/70">
          Seleziona il vincitore del match. Anche <strong className="text-white font-bold">{opponentName}</strong> dovrà confermare lo stesso risultato.
        </p>

        {/* 2 Card Giocatori Liquid Glass Arancione */}
        <div className="mt-6 flex flex-col gap-3.5">
          <PlayerWinnerCard
            isMe
            title="IO"
            subtitle={`(${localName})`}
            badge="Vittoria mia"
            avatar={myAvatar}
            disabled={busy}
            onSelect={() => onDeclare(true)}
          />

          <PlayerWinnerCard
            isMe={false}
            title={opponentName}
            badge="Vittoria avversario"
            avatar={oppAvatar}
            disabled={busy}
            onSelect={() => onDeclare(false)}
          />
        </div>

        {/* Tasto Annulla */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-wider text-white/40 transition hover:text-white"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}

interface PlayerWinnerCardProps {
  isMe: boolean;
  title: string;
  subtitle?: string;
  badge: string;
  avatar: ProfileAvatar;
  disabled?: boolean;
  onSelect: () => void;
}

function PlayerWinnerCard({
  isMe,
  title,
  subtitle,
  badge,
  avatar,
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
        'group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left backdrop-blur-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        'border-white/15 bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
        'hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/[0.18] hover:via-amber-500/[0.08] hover:to-white/[0.05] hover:shadow-[0_0_25px_rgba(255,115,0,0.3)] hover:-translate-y-0.5',
      )}
    >
      {/* Liquid Glass Highlight: riflesso superiore in vetro */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity group-hover:via-primary/70"
      />

      {/* Liquid Orange Glow morbido nell'angolo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -right-10 h-28 w-28 rounded-full bg-primary/10 blur-xl transition-all duration-300 group-hover:bg-primary/25 group-hover:scale-125"
      />

      {/* Avatar del giocatore + info */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className={cn('relative grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/20 bg-gradient-to-b from-slate-900 via-header-bg to-black p-1 shadow-inner group-hover:border-primary/60 transition-colors', avatar.bgGradient)}>
          <AvatarIcon className={cn('h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] transition-transform duration-200 group-hover:scale-110', avatar.color)} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-black text-white sm:text-lg">
              {title}
            </span>
            {subtitle && (
              <span className="truncate text-xs font-bold text-white/50">
                {subtitle}
              </span>
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider text-primary group-hover:text-amber-300 transition-colors">
            {badge}
          </span>
        </div>
      </div>

      {/* Icona Trofeo di selezione */}
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/40 shadow-xs transition-all duration-200 group-hover:border-primary/50 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(255,115,0,0.5)]">
        <Trophy className="h-4.5 w-4.5" />
      </div>
    </button>
  );
}
