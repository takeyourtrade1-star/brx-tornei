'use client';

import { Crown, Sparkles, Swords, Trophy, User } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchIntroCardProps {
  phase: 'shuffle' | 'reveal';
  starter: Participant;
  drawingName: string;
}

/** Dorso decorato della carta in stile TCG premium Ebartex */
function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative h-[22rem] w-60 select-none overflow-hidden rounded-[1.25rem] border-2 border-primary/50 bg-[#070b18] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] sm:h-[24rem] sm:w-64',
        className,
      )}
    >
      {/* Cornice interna geometrica dorata */}
      <div className="relative flex h-full w-full flex-col items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-b from-[#0c142c] via-[#070b18] to-[#04060d] p-3">
        <span aria-hidden className="pointer-events-none absolute inset-1.5 rounded-lg border border-primary/20" />

        {/* Emblema centrale romboidale */}
        <div className="relative grid h-24 w-24 place-items-center rounded-2xl border border-primary/50 bg-gradient-to-br from-primary/30 via-header-bg to-header-bg shadow-[0_0_30px_rgba(255,115,0,0.4)] sm:h-28 sm:w-28">
          <Swords className="h-12 w-12 text-primary drop-shadow-[0_0_12px_rgba(255,115,0,0.8)]" aria-hidden />
        </div>

        <span className="mt-4 font-display text-xs font-black uppercase tracking-[0.3em] text-white/40">
          Ebartex TCG
        </span>
      </div>
    </div>
  );
}

/** Fronte della carta rivelata in stile Ultra-Rare olografica */
function CardFront({ starter }: { starter: Participant }) {
  return (
    <div className="intro-card-glow relative h-[22rem] w-60 select-none overflow-hidden rounded-[1.25rem] border-2 border-amber-300/80 bg-gradient-to-b from-[#1b2649] via-[#0e1732] to-[#070a18] p-3 text-white shadow-[0_30px_70px_-12px_rgba(255,115,0,0.6)] sm:h-[24rem] sm:w-64">
      {/* Lamina olografica iridescente animata */}
      <div className="intro-foil-effect pointer-events-none absolute inset-0 z-20 mix-blend-color-dodge opacity-70" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col justify-between rounded-xl border border-amber-300/40 bg-[#060a16]/85 p-3.5 backdrop-blur-sm">
        {/* Intestazione carta */}
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-300">
            <Crown className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            1° Di Turno
          </span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/40">
            Inizia
          </span>
        </div>

        {/* Illustrazione centrale avatar */}
        <div className="relative my-auto flex flex-col items-center">
          <div className="relative grid h-24 w-24 place-items-center rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/30 via-header-bg to-header-bg shadow-[0_0_35px_rgba(255,115,0,0.55)] sm:h-28 sm:w-28">
            <User className="h-12 w-12 text-white" aria-hidden />
            <span className="absolute -bottom-2.5 inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200 backdrop-blur-md">
              <Trophy className="h-2.5 w-2.5" aria-hidden />
              Vincitore
            </span>
          </div>
        </div>

        {/* Scheda dati giocatore */}
        <div className="border-t border-white/15 pt-2.5 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            Giocatore
          </span>
          <h3 className="truncate font-display text-xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_12px_rgba(255,115,0,0.8)] sm:text-2xl">
            {starter.username}
          </h3>
          {starter.deck?.name && (
            <p className="mt-0.5 truncate text-[11px] font-bold text-primary">
              {starter.deck.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MatchIntroCard({ phase, starter, drawingName }: MatchIntroCardProps) {
  const isReveal = phase === 'reveal';

  return (
    <div className="relative z-10 flex w-full max-w-xl flex-col items-center px-4 text-center">
      {/* Banner di stato */}
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-primary shadow-sm">
        {isReveal ? (
          <>
            <Sparkles className="h-4 w-4 animate-spin text-amber-300" aria-hidden />
            Esito sorteggio
          </>
        ) : (
          <>
            <Swords className="h-4 w-4 text-primary" aria-hidden />
            Sorteggio in corso
          </>
        )}
      </div>

      <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
        {isReveal ? 'Ha vinto il sorteggio' : 'Chi gioca per primo?'}
      </h2>

      {/* Area 3D delle carte */}
      <div className="intro-3d-wrap relative mt-6 flex h-80 w-full items-center justify-center sm:h-96">
        {!isReveal ? (
          /* Mazzo in mischiamento continuo */
          <div className="relative flex h-full w-full items-center justify-center">
            <div className="intro-card-shuffling-left absolute">
              <CardBack className="opacity-75" />
            </div>
            <div className="intro-card-shuffling-right absolute">
              <CardBack className="opacity-75" />
            </div>
            <div className="intro-card-shuffling-center absolute z-10">
              <CardBack />
            </div>
          </div>
        ) : (
          /* Carta estratta che si gira a 180° */
          <div className="intro-card-flipping intro-card-inner relative">
            <div className="intro-card-face intro-card-back absolute inset-0">
              <CardBack />
            </div>
            <div className="intro-card-face intro-card-front relative">
              <CardFront starter={starter} />
            </div>
          </div>
        )}
      </div>

      {/* Didascalia e annuncio finale */}
      {!isReveal ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            Mescolando il mazzo per decidere chi parte…
          </p>
          <p className="mt-1 font-display text-lg font-black uppercase tracking-wider text-primary">
            {drawingName}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <h1 className="bg-gradient-to-r from-amber-200 via-primary to-amber-300 bg-clip-text font-display text-3xl font-black uppercase tracking-wider text-transparent drop-shadow-sm sm:text-5xl">
            {starter.username}
          </h1>
          <p className="mt-1 font-display text-sm font-black uppercase tracking-[0.3em] text-white/90 sm:text-base">
            inizia la partita (Turno 1)
          </p>
        </div>
      )}
    </div>
  );
}
