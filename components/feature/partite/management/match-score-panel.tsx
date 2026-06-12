import { Trophy } from 'lucide-react';
import { gamesToWin, BEST_OF_LABEL } from '@/lib/matches/best-of';
import type { MatchDetail } from '@/types/match';

interface MatchScorePanelProps {
  match: MatchDetail;
}

/** Pannello punteggi attuali e storico game. */
export function MatchScorePanel({ match }: MatchScorePanelProps) {
  const { scoreState } = match;
  const needed = gamesToWin(match.bestOf);

  return (
    <section className="brx-glass rounded-2xl border border-white/15 p-5">
      <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-marquee">
        <Trophy className="h-4 w-4" />
        Punteggi
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.06] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-white/45">Match ({BEST_OF_LABEL[match.bestOf]})</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-white">
            {scoreState.selfGames}
            <span className="mx-2 text-white/25">—</span>
            {scoreState.opponentGames}
          </p>
          <p className="mt-1 text-xs text-white/50">Primo a {needed} game</p>
        </div>
        <div className="rounded-xl bg-white/[0.06] p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-white/45">Game corrente</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-marquee">
            {scoreState.currentGameSelfPoints}
            <span className="mx-2 text-white/25">—</span>
            {scoreState.currentGameOpponentPoints}
          </p>
          <p className="mt-1 text-xs text-white/50">Punti nel game in corso</p>
        </div>
      </div>

      {scoreState.gamesHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">Storico game</h3>
          <ul className="mt-2 divide-y divide-white/10 rounded-xl border border-white/10">
            {scoreState.gamesHistory.map((game) => (
              <li
                key={game.gameNumber}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-white/70">Game {game.gameNumber}</span>
                <span className="font-semibold text-white">
                  {game.selfPoints} — {game.opponentPoints}
                </span>
                <span className="text-xs text-marquee">
                  {game.winner === 'self' ? 'Tu' : match.opponent}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {scoreState.isFinished && (
        <p className="mt-4 rounded-lg bg-emerald-500/15 px-3 py-2 text-center text-sm font-bold text-emerald-300">
          Vincitore: {scoreState.winner === 'self' ? 'Tu' : match.opponent}
        </p>
      )}
    </section>
  );
}
