'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import type { Selection } from '@/lib/validations/selection';

/**
 * Bottone "Crea Torneo" — unico punto interattivo della dashboard.
 * MVP: crea direttamente un torneo BO3 For Fun; in M4+ aprirà un form/modal.
 */
export function CreateTournamentButton({ selection }: { selection: Selection }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const formData = new FormData();
    formData.set('format', selection.format);
    formData.set('mode', selection.mode);
    formData.set('bestOf', 'BO3');

    setError(null);
    startTransition(async () => {
      const result = await createTournamentAction(formData);
      if (result.error) setError(result.error);
      // In caso di successo revalidatePath('/tornei') aggiorna la tabella.
    });
  }

  return (
    <div className="flex items-center gap-3">
      {error && (
        <p role="alert" className="text-sm font-medium text-red-300">
          {error}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="brx-liquid-glass-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-sans font-bold text-sm uppercase tracking-wide text-white disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {isPending ? 'Creazione…' : 'Crea Torneo'}
      </button>
    </div>
  );
}
