'use client';

import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { createTournamentAction } from '@/actions/tournaments';
import { AuthGateButton } from '@/components/feature/auth/auth-gate-button';
import { getDefaultMaxPlayers } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import { cn } from '@/lib/utils';

interface CreateTournamentButtonProps {
  selection: Selection;
  isLoggedIn: boolean;
  className?: string;
}

const BTN_CLASS =
  'brx-liquid-glass-btn flex items-center gap-2 rounded-full px-6 py-2.5 font-sans text-sm font-bold uppercase tracking-wide text-white disabled:pointer-events-none disabled:opacity-50';

/**
 * Bottone "Crea Torneo" con gate auth via popup per utenti non loggati.
 */
export function CreateTournamentButton({
  selection,
  isLoggedIn,
  className,
}: CreateTournamentButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    const formData = new FormData();
    formData.set('format', selection.format);
    formData.set('mode', selection.mode);
    formData.set('buyIn', 'for_fun');
    formData.set('bestOf', 'BO3');
    formData.set('maxPlayers', String(getDefaultMaxPlayers(selection.mode)));
    formData.set('visibility', 'public');

    setError(null);
    startTransition(async () => {
      const result = await createTournamentAction(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3', className)}>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-300">
          {error}
        </p>
      )}
      <AuthGateButton
        isLoggedIn={isLoggedIn}
        onAuthenticated={handleCreate}
        disabled={isPending}
        className={cn(BTN_CLASS, 'w-full justify-center sm:w-auto')}
        aria-label="Crea torneo"
      >
        <Plus className="h-4 w-4" />
        {isPending ? 'Creazione…' : 'Crea Torneo'}
      </AuthGateButton>
    </div>
  );
}
