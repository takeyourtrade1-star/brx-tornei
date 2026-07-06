'use client';

import type { DeckLegalityIssue } from '@/types/card-legality';

interface DeckLegalityPanelProps {
  issues: DeckLegalityIssue[];
  loading?: boolean;
  legal?: boolean;
}

export function DeckLegalityPanel({ issues, loading, legal }: DeckLegalityPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50">
        Verifica legalità Scryfall in corso…
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
