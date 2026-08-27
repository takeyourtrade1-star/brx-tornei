'use client';

import type { DeckLegalityIssue } from '@/types/card-legality';

interface DeckLegalityPanelProps {
  issues: DeckLegalityIssue[];
  loading?: boolean;
  legal?: boolean;
  /** Errore dell'ultima verifica (sessione, rete, backend): mai silenzioso. */
  error?: string | null;
}

export function DeckLegalityPanel({ issues, loading, legal, error }: DeckLegalityPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
        Verifica legalità Asso Vision in corso…
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-200"
      >
        Verifica non completata: {error}
      </div>
    );
  }

  if (legal === true && issues.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
        Mazzo legale per il formato selezionato.
      </div>
    );
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-red-200">
        Problemi di legalità ({issues.length})
      </p>
      <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs text-red-100/90">
        {issues.map((issue, i) => (
          <li key={`${issue.blueprintId}-${i}`}>• {issue.message}</li>
        ))}
      </ul>
    </div>
  );
}
