'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useMembership } from '@/hooks/use-membership';

interface MembershipGateProps {
  children: ReactNode;
}

/**
 * Gate del primo accesso (mock): se l'utente non ha ancora visto l'onboarding
 * tessera (`status: 'none'`) lo dirotta su /associazione. Chi è socio o ha
 * saltato prosegue normalmente verso i tornei.
 */
export function MembershipGate({ children }: MembershipGateProps) {
  const router = useRouter();
  const { state, loading } = useMembership();
  const mustOnboard = state?.status === 'none';

  useEffect(() => {
    if (mustOnboard) router.replace('/associazione');
  }, [mustOnboard, router]);

  if (loading || mustOnboard) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        aria-busy="true"
        aria-label="Caricamento"
      >
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
      </div>
    );
  }

  return <>{children}</>;
}
