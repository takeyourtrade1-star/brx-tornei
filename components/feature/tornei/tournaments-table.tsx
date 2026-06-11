import type { BestOf, Tournament } from '@/types/tournament';
import { StatusBadge } from './status-badge';

/** "Forma" dal mockup: best-of mostrato come frazione (2/3, 3/5). */
const BEST_OF_LABEL: Record<BestOf, string> = {
  BO1: '1',
  BO3: '2/3',
  BO5: '3/5',
};

/**
 * Tabella tornei (dal mockup): Buy-In · Forma · Stato · Registrati · Partecipanti.
 * Server component in pannello glass Ebartex; i dati arrivano già pronti dalla pagina.
 */
export function TournamentsTable({ tournaments }: { tournaments: Tournament[] }) {
  if (tournaments.length === 0) {
    return (
      <div className="brx-glass rounded-3xl border border-white/15 p-12 text-center">
        <p className="font-sans text-xl font-bold uppercase tracking-wide text-white/80">
          Nessun torneo per questa selezione
        </p>
        <p className="mt-2 text-sm text-white/55">Creane uno con “Crea Torneo”.</p>
      </div>
    );
  }

  return (
    <div className="brx-glass overflow-x-auto rounded-3xl border border-white/15">
      <table className="w-full min-w-[680px] text-left text-sm text-white">
        <thead>
          <tr className="border-b border-white/15 font-sans text-xs font-bold uppercase tracking-widest text-marquee">
            <th scope="col" className="px-5 py-4">Buy-In</th>
            <th scope="col" className="px-5 py-4">Forma</th>
            <th scope="col" className="px-5 py-4">Stato</th>
            <th scope="col" className="px-5 py-4">Registrati</th>
            <th scope="col" className="px-5 py-4">Partecipanti</th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((t) => (
            <tr
              key={t.id}
              className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.06]"
            >
              <td className="px-5 py-4">
                <span className="rounded-full bg-marquee/15 px-3 py-1 font-sans text-sm font-bold uppercase tracking-wide text-marquee">
                  For Fun
                </span>
              </td>
              <td className="px-5 py-4 font-sans text-lg font-bold text-white/90">
                {BEST_OF_LABEL[t.bestOf]}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={t.status} />
              </td>
              <td className="px-5 py-4 font-sans text-lg font-bold tabular-nums text-white/90">
                {t.participants.length}/{t.maxPlayers}
              </td>
              <td className="px-5 py-4">
                {t.participants.length === 0 ? (
                  <span className="text-white/35">—</span>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {t.participants.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 py-0.5 pl-0.5 pr-2.5 ring-1 ring-white/15"
                      >
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-card1 text-[10px] font-bold">
                          {p.username[0]?.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-white/85">{p.username}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
