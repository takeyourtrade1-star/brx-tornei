'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createAuthRefreshReconciler } from '@/lib/auth/refresh-reconciler';

/** Reconciles a conservative refresh marker after explicit auth navigation. */
export function AuthRefreshReconciler() {
  const pathname = usePathname();
  const reconcile = useRef<ReturnType<typeof createAuthRefreshReconciler>>();
  if (!reconcile.current) reconcile.current = createAuthRefreshReconciler();

  useEffect(() => {
    void reconcile.current?.(pathname);
  }, [pathname]);

  return null;
}
