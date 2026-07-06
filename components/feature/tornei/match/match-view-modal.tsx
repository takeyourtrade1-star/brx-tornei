'use client';

import { Eye, PictureInPicture2, Swords, X } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import { usePlayerWebcam } from '@/hooks/use-player-webcam';
import { matchPlayers } from './match-players';
import { WebcamTile } from './webcam-tile';

export type MatchRole = 'player' | 'observer';

interface MatchViewModalProps {
  open: boolean;
  tournament: Tournament | null;
  role: MatchRole;
  me?: string;
  onClose: () => void;
  onPip?: () => void;
}

/**
 * Vista partita live (modale legacy). Due webcam e nomi giocatori.
 */
export function MatchViewModal({
  open,
  tournament,
  role,
  onClose,
  onPip,
}: MatchViewModalProps) {
  const isObserver = role === 'observer';
  const { stream: localStream, feedLabel } = usePlayerWebcam(open && !isObserver);

  if (!open || !tournament) return null;

  const [playerA, playerB] = matchPlayers(tournament);

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="brx-glass relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 p-5 sm:p-6">
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
                {playerA.username} vs {playerB.username}
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="relative aspect-video sm:aspect-auto sm:min-h-[260px]">
            {isObserver ? (
              <WebcamTile username={playerA.username} />
            ) : (
              <WebcamTile
                stream={localStream}
                username={playerA.username}
                feedLabel={feedLabel}
              />
            )}
          </div>
          <div className="relative aspect-video sm:aspect-auto sm:min-h-[260px]">
            <WebcamTile username={playerB.username} />
          </div>
        </div>
      </div>
    </div>
  );
}
