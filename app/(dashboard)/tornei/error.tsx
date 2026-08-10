'use client';

import { useEffect } from 'react';

export default function TournamentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Tournaments]', error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-muted px-5 py-12 text-foreground">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card px-7 py-10 text-center shadow-xl shadow-black/5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Ebartex Tornei
        </p>
        <h1 className="mt-3 font-display text-2xl font-black tracking-tight">
          Connessione momentaneamente interrotta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          La sessione è al sicuro. Riprova per ricaricare tavoli e profilo giocatore.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-gradient-global px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
        >
          Riprova
        </button>
        {error.digest ? (
          <p className="mt-5 text-[11px] text-muted-foreground">Riferimento: {error.digest}</p>
        ) : null}
      </section>
    </main>
  );
}
