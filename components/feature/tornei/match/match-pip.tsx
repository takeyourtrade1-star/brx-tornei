'use client';

import { Maximize2, X } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import { matchPlayers } from './match-players';
import { WebcamTile } from './webcam-tile';

interface MatchPipProps {
  tournament: Tournament | null;
  onExpand: () => void;
  onClose: () => void;
}

/**
 * Picture-in-Picture dello spettatore: due webcam in miniatura.
 */
export function MatchPip({ tournament, onExpand, onClose }: MatchPipProps) {
  if (!tournament) return null;

  const [playerA, playerB] = matchPlayers(tournament);

  return (
    <div className="fixed bottom-4 right-4 z-[140] w-[360px] animate-auth-enter overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">
          Partita live
        </span>
        <div className="flex items-center">
          <button
            type="button"
            onClick={onExpand}
            aria-label="Espandi"
            className="grid h-5 w-5 place-items-center rounded text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="grid h-5 w-5 place-items-center rounded text-white/50 transition hover:bg-white/10 hover:text-red-300"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1">
        <div className="aspect-[4/3]">
          <WebcamTile username={playerA.username} compact />
        </div>
        <div className="aspect-[4/3]">
          <WebcamTile username={playerB.username} compact />
        </div>
      </div>
    </div>
  );
}
