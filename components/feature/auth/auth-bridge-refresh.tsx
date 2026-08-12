'use client';

import { useEffect } from 'react';
import { runAuthBridgeFlow } from '@/lib/auth/bridge-client-flow';

const runs = new Map<string, Promise<'next' | 'login'>>();

export function AuthBridgeRefresh({
  nonce,
  nextPath,
  loginPath,
}: {
  nonce: string;
  nextPath: string;
  loginPath: string;
}) {
  useEffect(() => {
    let disposed = false;
    const running = runs.get(nonce) ?? runAuthBridgeFlow(nonce);
    runs.set(nonce, running);
    void running.then((outcome) => {
      if (!disposed) window.location.replace(outcome === 'next' ? nextPath : loginPath);
    });
    return () => { disposed = true; };
  }, [loginPath, nextPath, nonce]);

  return (
    <main className="grid min-h-screen place-items-center bg-header-bg px-6 text-center text-white">
      <div className="space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        <p className="text-sm font-bold">Rinnovo sicuro della sessione…</p>
      </div>
    </main>
  );
}
