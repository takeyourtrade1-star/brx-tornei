import { Swords } from 'lucide-react';
import type { Match } from '@/types/match';
import { MatchCard } from './match-card';

/** Lista partite per tab Completate / In attesa. */
export function MatchesList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="brx-glass flex flex-col items-center rounded-3xl border border-white/15 px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <Swords className="h-8 w-8 text-white/50" aria-hidden />
        </div>
        <p className="font-sans text-xl font-bold uppercase tracking-wide text-white/80">
          Nessuna partita in questa categoria
        </p>
        <p className="mt-2 text-sm text-white/55">
          Prova un altro filtro o iscriviti a un torneo dalla dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="brx-glass overflow-hidden rounded-3xl border border-white/15">
      <ul className="divide-y divide-white/10">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </ul>
    </div>
  );
}
