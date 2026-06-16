'use client';

import { Heart, Layers, Swords } from 'lucide-react';
import { advantage, gameLabel, type MatchState } from './match-simulation';

/**
 * Pannello destro della vista match: punteggio best-of, indicatore "chi sta
 * vincendo", stato dei due giocatori (vite, mano, gare) e registro mosse live.
 */
export function MatchDataPanel({ state }: { state: MatchState }) {
  const [p0, p1] = state.players;
  const adv = advantage(state); // -100..100, positivo = p0 avanti
  const leader = adv > 6 ? p0 : adv < -6 ? p1 : null;
  // posizione 0..100 dell'indicatore (50 = equilibrio)
  const pos = 50 + adv / 2;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Intestazione gara */}
      <div className="flex items-center justify-between">
        <span className="rounded-lg bg-[#FF7300]/15 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#FF7300]">
          {gameLabel(state)}
        </span>
        <span className="font-mono text-[11px] text-white/55">
          Turno {state.turn} · {state.phase}
        </span>
      </div>

      {/* Chi sta vincendo */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
          Chi sta vincendo
        </p>
        <div className="relative h-2.5 w-full rounded-full bg-gradient-to-r from-sky-500/40 via-white/10 to-rose-500/40">
          <div
            className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-700"
            style={{ left: `${pos}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-xs font-bold text-white">
          {leader ? `${leader.flag} ${leader.username} è in vantaggio` : 'Partita in equilibrio'}
        </p>
      </div>

      {/* Stato giocatori */}
      <div className="grid grid-cols-2 gap-2">
        {state.players.map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
          >
            <p className="truncate text-xs font-bold text-white">
              {p.flag} {p.username}
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-black tabular-nums text-rose-300">
                <Heart className="h-3.5 w-3.5 fill-rose-400/30" /> {p.life}
              </span>
              <span className="flex items-center gap-1 text-white/65">
                <Layers className="h-3.5 w-3.5" /> {p.hand}
              </span>
              <span className="flex items-center gap-1 text-white/65">
                <Swords className="h-3.5 w-3.5" /> {p.games}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Registro mosse */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-white/10 bg-black/30">
        <p className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
          Mosse recenti
        </p>
        <ul className="scrollbar-none flex-1 space-y-1 overflow-y-auto p-2.5">
          {state.moves.map((m) => {
            const actor = state.players[m.by]!;
            return (
              <li key={m.id} className="flex items-start gap-2 text-[12px] leading-snug">
                <span className="mt-0.5 shrink-0 rounded bg-white/10 px-1 font-mono text-[9px] text-white/45">
                  T{m.turn}
                </span>
                <span className="text-white/80">
                  <b className={m.by === 0 ? 'text-sky-300' : 'text-rose-300'}>
                    {actor.username}
                  </b>{' '}
                  {m.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
