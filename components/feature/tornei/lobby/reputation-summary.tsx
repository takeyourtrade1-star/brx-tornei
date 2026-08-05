import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReputationSummary as ReputationSummaryData } from '@/lib/data/player-api-client';

const OUTCOME_LABEL: Record<string, string> = {
  win: 'Vinta',
  loss: 'Persa',
  abandoned: 'Abbandonata',
  disputed: 'Contestata',
};

/** Sezione dashboard reputazione (Requisito 2): aggregati dal ledger
 * match_results + ultime partite. Nulla da mostrare finché non si è mai
 * giocato: non aggiunge rumore alla lobby di un giocatore nuovo. */
export function ReputationSummary({ reputation }: { reputation: ReputationSummaryData | null }) {
  if (!reputation || reputation.played === 0) return null;

  return (
    <Card className="mb-6 overflow-hidden border-white/15 bg-gradient-to-br from-footer-start via-card2-end to-card2-end text-white shadow-xl shadow-card2-end/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-sans text-sm font-black uppercase tracking-[0.18em] text-white/70">
          Le tue partite
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 pt-0 sm:grid-cols-5">
        <Stat label="Giocate" value={reputation.played} />
        <Stat label="Vinte" value={reputation.wins} />
        <Stat label="Perse" value={reputation.losses} />
        <Stat label="Abbandonate" value={reputation.abandoned} />
        <Stat label="Contestate" value={reputation.disputed} />
      </CardContent>
      {reputation.recent.length > 0 && (
        <CardContent className="grid gap-1.5 border-t border-white/10 pt-4 text-sm text-white/70">
          {reputation.recent.slice(0, 5).map((m, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <span className="truncate">vs {m.opponentGamertag ?? 'Avversario'}</span>
              <span className="shrink-0 font-bold uppercase tracking-wide text-white/85">
                {OUTCOME_LABEL[m.outcome] ?? m.outcome}
              </span>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-black text-primary">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
