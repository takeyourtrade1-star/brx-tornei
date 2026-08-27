'use client';

import { useEffect } from 'react';
import { ArenaAtmosphere } from '@/components/layout/arena-atmosphere';
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
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-6 text-center text-white">
      <ArenaAtmosphere />
      <div className="relative z-[1] space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
        <p className="text-sm font-bold">Bentornato! Carico i tuoi tornei…</p>
      </div>
    </main>
  );
}
