'use client';

import { useState, useTransition } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { enrollInTournamentAction } from '@/actions/tournaments';
import { AuthGateButton } from '@/components/feature/auth/auth-gate-button';
import { cn } from '@/lib/utils';

interface ParticipateButtonProps {
  tournamentId: string;
  isLoggedIn: boolean;
  isPrivate: boolean;
  /** `prominent` = CTA full-width su card mobile. */
  variant?: 'inline' | 'prominent';
}

const INLINE_CLASS =
  'brx-liquid-glass-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:scale-105 disabled:pointer-events-none disabled:opacity-50';

const PROMINENT_CLASS =
  'brx-liquid-glass-btn flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50';

/**
 * Azione "Partecipa" / "Chiedi di partecipare" con gate auth e controllo overlap.
 */
export function ParticipateButton({
  tournamentId,
  isLoggedIn,
  isPrivate,
  variant = 'inline',
}: ParticipateButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleParticipate() {
    setError(null);
    startTransition(async () => {
      const result = await enrollInTournamentAction(tournamentId);
      if (result.error) setError(result.error);
    });
  }

  const label = isPrivate ? 'Chiedi di partecipare' : 'Partecipa';
  const Icon = isPrivate ? UserPlus : Plus;
  const isProminent = variant === 'prominent';

  return (
    <div className={cn('flex flex-col gap-1.5', isProminent ? 'w-full' : 'items-start')}>
      {error && (
        <p
          role="alert"
          className={cn(
            'font-medium leading-snug text-red-300',
            isProminent ? 'text-center text-xs' : 'max-w-xs text-[10px]'
          )}
        >
          {error}
        </p>
      )}
      <AuthGateButton
        isLoggedIn={isLoggedIn}
        onAuthenticated={handleParticipate}
        disabled={isPending}
        className={isProminent ? PROMINENT_CLASS : INLINE_CLASS}
        aria-label={isPrivate ? 'Chiedi di partecipare' : 'Partecipa al torneo'}
      >
        <Icon className={cn('shrink-0', isProminent ? 'h-4 w-4' : 'h-3.5 w-3.5')} />
        {isPending ? 'Iscrizione…' : label}
      </AuthGateButton>
    </div>
  );
}
