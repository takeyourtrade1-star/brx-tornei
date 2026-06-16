'use client';

import { Eye, PictureInPicture2, Swords, X } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import { useMatchSimulation } from './use-match-simulation';
import { WebcamTile } from './webcam-tile';
import { MatchDataPanel } from './match-data-panel';

export type MatchRole = 'player' | 'observer';

interface MatchViewModalProps {
  open: boolean;
  tournament: Tournament | null;
  role: MatchRole;
  me?: string;
  /** Stream reale della propria webcam (telefono via QR), se disponibile. */
  playerStream?: MediaStream | null;
  onClose: () => void;
  /** Attiva il Picture-in-Picture (solo osservatore). */
  onPip?: () => void;
}

/**
 * Vista partita live di Magic. Mostra le due webcam (la nostra + quella
 * dell'avversario, simulata) e a destra i dati della partita. Si apre sia
 * come giocatore (dopo lo skip del QR) sia come osservatore (icona occhio).
 */
export function MatchViewModal({
  open,
  tournament,
  role,
  me,
  playerStream,
  onClose,
  onPip,
}: MatchViewModalProps) {
  // La simulazione resta attiva solo a modale aperto.
  const state = useMatchSimulation(tournament, me, open);

  if (!open || !tournament || !state) return null;

  const isObserver = role === 'observer';
  // Da giocatore, la prima tile sono io e uso lo stream reale se c'è.
  const myStream = !isObserver ? playerStream ?? null : null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="brx-glass relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 p-5 sm:p-6">
        {/* Header */}
        <header className="mb-4 flex items-center justify-between gap-3 pr-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-[#FF7300]/40 bg-[#FF7300]/15 text-[#FF7300]">
              {isObserver ? <Eye className="h-5 w-5" /> : <Swords className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-wide text-white">
                {isObserver ? 'Stai osservando' : 'La tua partita'}
              </h2>
              <p className="text-xs text-white/55">
                {state.players[0].username} vs {state.players[1].username} ·{' '}
                <span className="capitalize">{state.format.replace('-', ' ')}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isObserver && onPip && (
              <button
                type="button"
                onClick={onPip}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 transition hover:bg-white/15 hover:text-white"
              >
                <PictureInPicture2 className="h-4 w-4" />
                <span className="hidden sm:inline">Picture-in-picture</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Corpo: webcam + dati */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
          {/* Webcam dei due giocatori */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[260px]">
              <WebcamTile
                stream={myStream}
                username={state.players[0].username}
                flag={state.players[0].flag}
                deck={state.players[0].deck}
                badge={`♥ ${state.players[0].life}`}
              />
              {!isObserver && (
                <span className="absolute right-2 top-2 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  Tu
                </span>
              )}
            </div>
            <div className="relative aspect-video sm:aspect-auto sm:min-h-[260px]">
              <WebcamTile
                username={state.players[1].username}
                flag={state.players[1].flag}
                deck={state.players[1].deck}
                badge={`♥ ${state.players[1].life}`}
              />
            </div>
          </div>

          {/* Pannello dati partita */}
          <div className="min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <MatchDataPanel state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
