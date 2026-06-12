import { Layers } from 'lucide-react';
import type { Selection } from '@/lib/validations/selection';
import { CreateDeckButton } from './create-deck-button';

interface DecksEmptyStateProps {
  selection: Selection;
}

/** Stato vuoto quando l'utente non ha ancora mazzi salvati. */
export function DecksEmptyState({ selection }: DecksEmptyStateProps) {
  return (
    <div className="brx-glass flex flex-col items-center rounded-3xl border border-white/15 px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Layers className="h-8 w-8 text-marquee" aria-hidden />
      </div>
      <p className="font-sans text-xl font-bold uppercase tracking-wide text-white/80">
        Nessun mazzo salvato
      </p>
      <p className="mt-2 max-w-sm text-sm text-white/55">
        Crea il tuo primo mazzo per iscriverti ai tornei con un listino già pronto.
      </p>
      <div className="mt-6">
        <CreateDeckButton selection={selection} />
      </div>
    </div>
  );
}
