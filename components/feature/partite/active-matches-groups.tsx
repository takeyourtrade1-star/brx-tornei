import { CalendarClock, Swords } from 'lucide-react';
import type { ActiveMatchesGrouped } from '@/types/match';
import { MatchCard } from './match-card';

function GroupEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 px-6 py-10 text-center">
      <p className="font-sans text-sm font-bold uppercase tracking-wide text-white/60">{title}</p>
      <p className="mt-1 text-xs text-white/45">{description}</p>
    </div>
  );
}

function MatchGroup({
  title,
  icon,
  matches,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  icon: 'swords' | 'calendar';
  matches: ActiveMatchesGrouped['inCorso'];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 font-sans text-sm font-bold uppercase tracking-widest text-marquee">
        {icon === 'swords' ? (
          <Swords className="h-4 w-4" aria-hidden />
        ) : (
          <CalendarClock className="h-4 w-4" aria-hidden />
        )}
        {title}
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-white/70">
          {matches.length}
        </span>
      </h2>

      {matches.length === 0 ? (
        <GroupEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Tab Attive: due gruppi distinti In corso e Programmate. */
export function ActiveMatchesGroups({ groups }: { groups: ActiveMatchesGrouped }) {
  const isEmpty = groups.inCorso.length === 0 && groups.programmate.length === 0;

  if (isEmpty) {
    return (
      <div className="brx-glass flex flex-col items-center rounded-3xl border border-white/15 px-8 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
          <Swords className="h-8 w-8 text-white/50" aria-hidden />
        </div>
        <p className="font-sans text-xl font-bold uppercase tracking-wide text-white/80">
          Nessuna partita attiva
        </p>
        <p className="mt-2 text-sm text-white/55">
          Iscriviti a un torneo dalla dashboard per iniziare.
        </p>
      </div>
    );
  }

  return (
    <div className="brx-glass flex flex-col gap-8 rounded-3xl border border-white/15 p-5 sm:p-6">
      <MatchGroup
        title="In corso"
        icon="swords"
        matches={groups.inCorso}
        emptyTitle="Nessuna partita in corso"
        emptyDescription="Le partite già avviate compariranno qui."
      />
      <MatchGroup
        title="Programmate"
        icon="calendar"
        matches={groups.programmate}
        emptyTitle="Nessuna partita programmata"
        emptyDescription="Le iscrizioni confermate a tornei futuri compariranno qui."
      />
    </div>
  );
}
