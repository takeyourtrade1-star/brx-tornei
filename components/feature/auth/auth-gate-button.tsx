'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useAuthModal } from '@/components/feature/auth/auth-modal-provider';

interface AuthGateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoggedIn: boolean;
  onAuthenticated: () => void;
  children: ReactNode;
}

/**
 * Bottone che apre il popup auth se l'utente non è loggato,
 * altrimenti esegue l'azione protetta.
 */
export function AuthGateButton({
  isLoggedIn,
  onAuthenticated,
  children,
  onClick,
  ...props
}: AuthGateButtonProps) {
  const { openAuthModal } = useAuthModal();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (!isLoggedIn) {
      openAuthModal(onAuthenticated);
      return;
    }
    onAuthenticated();
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
