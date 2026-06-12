import { Info } from 'lucide-react';
import { DEMO_MATCH_DURATION_MINUTES } from '@/lib/matches/timing';

/** Banner informativo sulla durata massima in fase demo. */
export function DemoDurationBanner() {
  return (
    <div
      role="note"
      className="flex gap-3 rounded-2xl border border-marquee/25 bg-marquee/10 px-4 py-3 text-sm text-white/85"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-marquee" aria-hidden />
      <p>
        <span className="font-bold text-marquee">Fase demo:</span> ogni partita e torneo ha una
        durata massima di{' '}
        <span className="font-bold text-white">{DEMO_MATCH_DURATION_MINUTES} minuti</span>. Gli
        orari di fine mostrati sono stimati in base a questo limite.
      </p>
    </div>
  );
}
