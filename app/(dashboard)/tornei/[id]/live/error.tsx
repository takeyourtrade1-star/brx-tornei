'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function TournamentLiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TournamentLive]', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-xl font-black uppercase tracking-wide text-white">
        Errore caricamento partita
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/65">
        {error.message.includes('Tournament Service') || error.message.includes('API')
          ? 'Il Tournament Service non è raggiungibile. Verifica NEXT_PUBLIC_TOURNAMENTS_API_URL o rimuovilo per usare il mock in locale.'
          : 'Si è verificato un errore imprevisto. Riprova o torna alla lista tornei.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white"
        >
          Riprova
        </button>
        <Link
          href="/tornei"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          Torna ai tornei
        </Link>
      </div>
    </div>
  );
}
