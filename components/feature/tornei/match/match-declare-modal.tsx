'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Trophy, X } from 'lucide-react';
import { getAvatarForPlayer } from '@/lib/avatars';
import { cn } from '@/lib/utils';
import type { BestOf } from '@/types/tournament';
import { PlayerWinnerCard } from './player-winner-card';

export interface MatchDeclareModalProps {
  open: boolean;
  localName: string;
  opponentName: string;
  bestOf: BestOf;
  qualifyingMatches: number;
  busy?: boolean;
  onDeclare: (iWon: boolean, loserScore: number) => void;
  onClose: () => void;
}

/**
 * Modale di dichiarazione esito partita con card giocatori in stile liquid glass arancione.
 * Renderizzato in portal su document.body con z-[9999] per non finire mai sotto le webcam o altri layer.
 */
export function MatchDeclareModal({
  open,
  localName,
  opponentName,
  bestOf,
  qualifyingMatches,
  busy = false,
  onDeclare,
  onClose,
}: MatchDeclareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [iWon, setIWon] = useState<boolean | null>(null);
  const [loserScore, setLoserScore] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setIWon(null);
    setLoserScore(null);
  }, [open]);

  if (!open || !mounted) return null;

  const winsNeeded = bestOf === 'BO5' ? 3 : bestOf === 'BO1' ? 1 : 2;
  const myAvatar = getAvatarForPlayer(localName, true, qualifyingMatches);
  const oppAvatar = getAvatarForPlayer(opponentName, false);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Termina partita: chi ha vinto?"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="flex min-h-full items-center justify-center py-6 sm:py-8">
        <div className="relative my-auto w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-[#161d36]/95 via-[#0c1226]/95 to-[#060a16]/98 p-6 sm:p-8 text-center text-white shadow-2xl shadow-black/80 backdrop-blur-2xl ring-1 ring-white/10">
          {/* Glow ambientale arancione sullo sfondo del modale */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-primary/20 blur-3xl"
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
          <p className="mt-2 text-xs sm:text-sm font-medium leading-relaxed text-white/70 max-w-lg mx-auto">
            Indica vincitore e punteggio. Anche <strong className="font-bold text-white">{opponentName}</strong> dovrà confermare lo stesso risultato.
          </p>

          {/* 2 Card Giocatori Liquid Glass Arancione in griglia affiancata */}
          <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 text-left">
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

          {/* Selezione punteggio */}
          <div className="mt-6">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
              Risultato {bestOf}
            </p>
            <div className="mt-2.5 flex justify-center gap-2.5">
              {Array.from({ length: winsNeeded }, (_, score) => (
                <button
                  key={score}
                  type="button"
                  disabled={busy || iWon === null}
                  aria-pressed={loserScore === score}
                  onClick={() => setLoserScore(score)}
                  className={cn(
                    'h-11 min-w-24 rounded-xl border px-4 font-display text-sm font-black tracking-wider transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-35',
                    loserScore === score
                      ? 'border-primary bg-primary text-white shadow-[0_0_20px_rgba(255,115,0,0.4)] scale-105'
                      : 'border-white/15 bg-white/[0.06] text-white/75 hover:border-primary/50 hover:bg-white/10 hover:text-white',
                  )}
                >
                  {winsNeeded} – {score}
                </button>
              ))}
            </div>
          </div>

          {/* Azioni del modale */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 h-11 px-6 text-xs font-bold uppercase tracking-wider text-white/45 transition hover:text-white"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={busy || iWon === null || loserScore === null}
              onClick={() => iWon !== null && loserScore !== null && onDeclare(iWon, loserScore)}
              className="order-1 sm:order-2 inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-orange-600 px-8 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40 sm:text-sm"
            >
              <Check className="h-4 w-4" aria-hidden />
              Proponi risultato
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
