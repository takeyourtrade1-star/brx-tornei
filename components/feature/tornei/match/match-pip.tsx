'use client';

import { Maximize2, X } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import { useMatchSimulation } from './use-match-simulation';
import { advantage } from './match-simulation';
import { WebcamTile } from './webcam-tile';

interface MatchPipProps {
  tournament: Tournament | null;
  me?: string;
  /** Riapre il modale match a tutto schermo. */
  onExpand: () => void;
  onClose: () => void;
}

/**
 * Picture-in-Picture dello spettatore: finestrella fissa in basso a destra
 * (fuori dal minigioco) con le due webcam in miniatura e il punteggio live.
 * Resta visibile mentre l'utente continua a muoversi nel minigioco.
 */
export function MatchPip({ tournament, me, onExpand, onClose }: MatchPipProps) {
  const state = useMatchSimulation(tournament, me, !!tournament);
  if (!tournament || !state) return null;

  const adv = advantage(state);
  const leader = adv > 6 ? state.players[0] : adv < -6 ? state.players[1] : null;

  return (
    <div className="fixed bottom-4 right-4 z-[140] w-[400px] animate-auth-enter overflow-hidden rounded-2xl border border-white/15 bg-slate-950/90 shadow-2xl backdrop-blur-md">
      {/* Barra titolo */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wide text-white/70">
          Partita Live
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

      {/* Due webcam in miniatura */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <div className="aspect-[4/3]">
          <WebcamTile
            username={state.players[0].username}
            flag={state.players[0].flag}
            badge={`♥${state.players[0].life}`}
            compact
            showLiveBadge={false}
          />
        </div>
        <div className="aspect-[4/3]">
          <WebcamTile
            username={state.players[1].username}
            flag={state.players[1].flag}
            badge={`♥${state.players[1].life}`}
            compact
            showLiveBadge={false}
          />
        </div>
      </div>

      {/* Riga stato */}
      <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-0 text-[10px]">
        <span className="text-white/55">
          T{state.turn} · {state.phase}
        </span>
        <span className="truncate font-bold text-white/80">
          {leader ? `${leader.flag} ${leader.username} avanti` : 'Equilibrio'}
        </span>
      </div>
    </div>
  );
}
