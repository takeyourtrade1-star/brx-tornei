'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  createCard,
  readMembership,
  writeMembership,
  type MembershipCard,
  type MembershipInput,
  type MembershipState,
} from '@/lib/membership/membership';

const STORAGE_KEY = 'ebartex.membership.v1';

interface UseMembership {
  /** `null` finché non è stato letto il localStorage (evita flash SSR). */
  state: MembershipState | null;
  loading: boolean;
  /** Crea la tessera, la salva e ritorna la card generata. */
  becomeMember: (input: MembershipInput) => MembershipCard;
  /** Salta l'associazione (solo spettatore / 1v1 tra amici). */
  skip: () => void;
  /** Reset mock (utile da profilo / debug). */
  reset: () => void;
}

/** Hook mock per la tessera "Associato" — persistito in localStorage. */
export function useMembership(): UseMembership {
  const [state, setState] = useState<MembershipState | null>(null);

  useEffect(() => {
    setState(readMembership());

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setState(readMembership());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const becomeMember = useCallback((input: MembershipInput) => {
    const card = createCard(input);
    const next: MembershipState = { status: 'member', card };
    writeMembership(next);
    setState(next);
    return card;
  }, []);

  const skip = useCallback(() => {
    const next: MembershipState = { status: 'skipped' };
    writeMembership(next);
    setState(next);
  }, []);

  const reset = useCallback(() => {
    const next: MembershipState = { status: 'none' };
    writeMembership(next);
    setState(next);
  }, []);

  return { state, loading: state === null, becomeMember, skip, reset };
}
