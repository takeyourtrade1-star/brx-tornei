'use client';

import { Crown, Sparkles, Swords, User } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';

interface MatchIntroCardProps {
  phase: 'shuffle' | 'reveal';
  starter: Participant;
  drawingName: string;
}

type CardBackSize = 'shuffle' | 'reveal';
const EBARTEX_CARD_FEATURES = [
  'Scambi',
  'Aste live',
  'BRX Express',
  'Tornei live',
  'Marketplace',
  'Scanner carte',
  'I miei mazzi',
  'Collezione',
] as const;

/** Dorso decorato della carta in stile TCG premium Ebartex. */
function CardBack({
  className,
  size = 'reveal',
  feature = 'Tornei live',
}: {
  className?: string;
  size?: CardBackSize;
  feature?: string;
}) {
  const compact = size === 'shuffle';

  return (
    <div
      className={cn(
        'relative select-none overflow-hidden border-2 border-primary/55 bg-header-bg shadow-[0_24px_55px_-18px_rgba(0,0,0,0.95)]',
        compact
          ? 'h-[12rem] w-[8.25rem] rounded-[0.9rem] p-2 sm:h-[15rem] sm:w-[10.25rem]'
          : 'h-[19rem] w-[13rem] rounded-[1.15rem] p-3 sm:h-[22rem] sm:w-60',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-full w-full flex-col items-center justify-center border border-amber-400/30 bg-gradient-to-b from-header-bg via-header-bg to-black',
          compact ? 'rounded-[0.65rem] p-2' : 'rounded-xl p-3',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute border border-primary/20',
            compact ? 'inset-1 rounded-[0.5rem]' : 'inset-1.5 rounded-lg',
          )}
        />
        <div
          className={cn(
            'relative grid place-items-center border border-primary/50 bg-gradient-to-br from-primary/30 via-header-bg to-header-bg shadow-[0_0_30px_rgba(255,115,0,0.35)]',
            compact ? 'h-12 w-12 rounded-xl sm:h-16 sm:w-16' : 'h-24 w-24 rounded-2xl',
          )}
        >
          <Swords
            className={cn(
              'text-primary drop-shadow-[0_0_10px_rgba(255,115,0,0.75)]',
              compact ? 'h-6 w-6 sm:h-8 sm:w-8' : 'h-12 w-12',
            )}
            aria-hidden
          />
        </div>
        <div
          className={cn(
            'flex flex-col items-center uppercase',
            compact ? 'mt-2 gap-0.5' : 'mt-4 gap-1',
          )}
        >
          <span className={cn('font-bold tracking-[0.24em] text-white/35', compact ? 'text-[6px] sm:text-[7px]' : 'text-[9px]')}>
            Ebartex
          </span>
          <strong className={cn('font-display font-black text-primary', compact ? 'max-w-24 text-[8px] tracking-[0.12em] sm:text-[10px]' : 'text-sm tracking-[0.16em]')}>
            {feature}
          </strong>
        </div>
      </div>
    </div>
  );
}

/** Fronte della carta rivelata in stile Ultra-Rare olografica. */
function CardFront({ starter }: { starter: Participant }) {
  return (
    <div className="intro-card-glow relative h-[19rem] w-[13rem] select-none overflow-hidden rounded-[1.15rem] border-2 border-amber-300/80 bg-gradient-to-b from-global-bg-start via-header-bg to-header-bg p-3 text-white shadow-[0_30px_70px_-12px_rgba(255,115,0,0.6)] sm:h-[22rem] sm:w-60">
      <div className="intro-foil-effect pointer-events-none absolute inset-0 z-20 mix-blend-color-dodge opacity-70" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col justify-between rounded-xl border border-amber-300/40 bg-header-bg/90 p-3.5 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-white/15 pb-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300 sm:text-[11px]">
            <Crown className="h-3.5 w-3.5" aria-hidden />
            Primo turno
          </span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary ring-1 ring-primary/40">
            Tornei live
          </span>
        </div>

        <div className="relative my-auto flex flex-col items-center">
          <span className="intro-reveal-halo absolute h-32 w-32 rounded-full border border-primary/30" aria-hidden />
          <div className="relative grid h-24 w-24 place-items-center rounded-2xl border-2 border-primary/60 bg-gradient-to-br from-primary/30 via-header-bg to-header-bg shadow-[0_0_35px_rgba(255,115,0,0.55)]">
            <User className="h-12 w-12 text-white" aria-hidden />
            <span className="absolute -bottom-2.5 inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-header-bg/90 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-200">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              Sorteggiato
            </span>
          </div>
        </div>

        <div className="border-t border-white/15 pt-2.5 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
            Giocatore iniziale
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

function ShufflePacket({ side }: { side: 'left' | 'right' }) {
  const featureOffset = side === 'left' ? 0 : 3;

  return (
    <div
      className={cn(
        'intro-shuffle-packet absolute left-1/2 top-1/2 z-10 h-[12rem] w-[8.25rem] sm:h-[15rem] sm:w-[10.25rem]',
        side === 'left' ? 'intro-shuffle-packet-left' : 'intro-shuffle-packet-right',
      )}
      aria-hidden
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="intro-shuffle-packet-card absolute inset-0"
        >
          <CardBack size="shuffle" feature={EBARTEX_CARD_FEATURES[featureOffset + index]} />
        </div>
      ))}
    </div>
  );
}

function RiffleCards() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span
          key={index}
          className={cn(
            'intro-riffle-card absolute left-1/2 top-1/2 grid h-[8.5rem] w-[5.75rem] place-items-center rounded-lg border-2 border-primary/45 bg-header-bg shadow-[0_20px_35px_-18px_rgba(0,0,0,0.95)] sm:h-[10.5rem] sm:w-[7.2rem]',
            index % 2 === 0 ? 'intro-riffle-card-left' : 'intro-riffle-card-right',
          )}
        >
          <span className="absolute inset-1 rounded-md border border-amber-300/25" />
          <span className="relative flex flex-col items-center gap-2 px-1">
            <Swords className="h-6 w-6 text-primary/80" aria-hidden />
            <strong className="max-w-20 text-center font-display text-[7px] font-black uppercase tracking-[0.1em] text-primary sm:text-[9px]">
              {EBARTEX_CARD_FEATURES[index]}
            </strong>
          </span>
        </span>
      ))}
    </div>
  );
}

function ShuffleStage() {
  return (
    <div className="intro-shuffle-stage relative h-full w-full" aria-hidden>
      <div className="intro-shuffle-table absolute left-1/2 top-1/2 h-28 w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/10 sm:w-[28rem]" />
      <ShufflePacket side="left" />
      <ShufflePacket side="right" />
      <RiffleCards />
      <div className="intro-shuffle-final-deck absolute left-1/2 top-1/2 z-20 h-[12rem] w-[8.25rem] sm:h-[15rem] sm:w-[10.25rem]">
        <CardBack size="shuffle" feature="Tornei live" />
      </div>
      <span className="intro-shuffle-impact absolute left-1/2 top-1/2 z-30 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35" />
    </div>
  );
}

export function MatchIntroCard({ phase, starter, drawingName }: MatchIntroCardProps) {
  const isReveal = phase === 'reveal';

  return (
    <div className="relative z-10 flex w-full max-w-2xl flex-col items-center px-4 text-center">
      <div className="intro-status-pill inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-[0.25em] text-primary shadow-sm">
        {isReveal ? (
          <><Sparkles className="h-4 w-4 text-amber-300" aria-hidden /> Sorteggio completato</>
        ) : (
          <><Swords className="h-4 w-4" aria-hidden /> Mescolamento</>
        )}
      </div>

      <h2 className="intro-stage-title mt-3 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
        {isReveal ? 'Il primo turno è deciso' : 'Chi aprirà la sfida?'}
      </h2>

      <div className="intro-3d-wrap relative mt-3 flex h-[17rem] w-full items-center justify-center sm:mt-5 sm:h-[21rem]">
        {isReveal ? (
          <div className="intro-card-reveal-shell relative">
            <div className="intro-card-face intro-card-reveal-back absolute inset-0"><CardBack feature="Tornei live" /></div>
            <div className="intro-card-face intro-card-reveal-front relative"><CardFront starter={starter} /></div>
          </div>
        ) : (
          <ShuffleStage />
        )}
      </div>

      {!isReveal ? (
        <div className="intro-shuffle-caption mt-3 sm:mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50 sm:text-xs">
            Taglio, riffle e ricomposizione del mazzo
          </p>
          <p className="mt-1 font-display text-lg font-black uppercase tracking-wider text-primary">
            {drawingName}
          </p>
        </div>
      ) : (
        <div className="intro-result-copy mt-3 sm:mt-4">
          <h1 className="bg-gradient-to-r from-amber-200 via-primary to-amber-300 bg-clip-text font-display text-3xl font-black uppercase tracking-wider text-transparent drop-shadow-sm sm:text-5xl">
            {starter.username}
          </h1>
          <p className="mt-1 font-display text-sm font-black uppercase tracking-[0.3em] text-white/90 sm:text-base">
            apre la partita · turno 1
          </p>
        </div>
      )}
    </div>
  );
}
