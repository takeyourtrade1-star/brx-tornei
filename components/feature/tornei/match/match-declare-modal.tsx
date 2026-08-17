'use client';

import { useEffect, useState } from 'react';
import { Check, Trophy, X } from 'lucide-react';
import { getAvatarForPlayer, type ProfileAvatar } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import type { BestOf } from '@/types/tournament';

export interface MatchDeclareModalProps {
  open: boolean;
  localName: string;
  opponentName: string;
  bestOf: BestOf;
  busy?: boolean;
  onDeclare: (iWon: boolean, loserScore: number) => void;
  onClose: () => void;
}

/**
 * Modale di dichiarazione esito partita con card giocatori in stile liquid glass arancione.
 */
export function MatchDeclareModal({
  open,
  localName,
  opponentName,
  bestOf,
  busy = false,
  onDeclare,
  onClose,
}: MatchDeclareModalProps) {
  const [iWon, setIWon] = useState<boolean | null>(null);
  const [loserScore, setLoserScore] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    setIWon(null);
    setLoserScore(null);
  }, [open]);
  if (!open) return null;

  const winsNeeded = bestOf === 'BO5' ? 3 : bestOf === 'BO1' ? 1 : 2;
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
          Indica vincitore e punteggio. Anche <strong className="font-bold text-white">{opponentName}</strong> dovrà confermare lo stesso risultato.
        </p>

        {/* 2 Card Giocatori Liquid Glass Arancione */}
        <div className="mt-6 flex flex-col gap-3.5">
          <PlayerWinnerCard
            isMe
            title="IO"
            subtitle={`(${localName})`}
            badge="Vittoria mia"
            avatar={myAvatar}
            selected={iWon === true}
            disabled={busy}
            onSelect={() => setIWon(true)}
          />

          <PlayerWinnerCard
            isMe={false}
            title={opponentName}
            badge="Vittoria avversario"
            avatar={oppAvatar}
            selected={iWon === false}
            disabled={busy}
            onSelect={() => setIWon(false)}
          />
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            Risultato {bestOf}
          </p>
          <div className="mt-2 flex justify-center gap-2">
            {Array.from({ length: winsNeeded }, (_, score) => (
              <button
                key={score}
                type="button"
                disabled={busy || iWon === null}
                aria-pressed={loserScore === score}
                onClick={() => setLoserScore(score)}
                className={cn(
                  'h-10 min-w-20 rounded-xl border px-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-35',
                  loserScore === score
                    ? 'border-primary bg-primary text-white shadow-[0_0_20px_rgba(255,115,0,0.35)]'
                    : 'border-white/15 bg-white/[0.06] text-white/70 hover:border-primary/50 hover:text-white',
                )}
              >
                {winsNeeded} – {score}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={busy || iWon === null || loserScore === null}
          onClick={() => iWon !== null && loserScore !== null && onDeclare(iWon, loserScore)}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-xs font-black uppercase tracking-wider text-white shadow-md transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
        >
          <Check className="h-4 w-4" aria-hidden />
          Proponi risultato
        </button>

        <div className="mt-3">
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
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function PlayerWinnerCard({
  isMe,
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
        'group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border p-3.5 sm:p-4 text-left backdrop-blur-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        selected
          ? 'border-primary/70 bg-primary/[0.16] shadow-[0_0_25px_rgba(255,115,0,0.25)]'
          : 'border-white/15 bg-white/[0.05] shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
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
