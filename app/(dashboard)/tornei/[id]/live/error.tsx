'use client';

import Link from 'next/link';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function TournamentLiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    console.error('[TournamentLive]', error);
  }, [error]);

  const handleRetry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-4">
      <div className="flex w-full flex-col items-center rounded-3xl border border-white/10 bg-header-bg/90 px-6 py-12 text-center text-white shadow-xl shadow-black/30">
      <h1 className="font-display text-xl font-black uppercase tracking-wide text-white">
        Errore caricamento partita
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-white/65">
        {error.message.includes('Tournament Service') || error.message.includes('API')
          ? 'Il Tournament Service non è raggiungibile. Verifica TOURNAMENTS_API_URL o rimuovilo per usare il mock in locale.'
          : 'Si è verificato un errore imprevisto. Riprova o torna alla lista tornei.'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
        >
          {isPending ? 'Riconnessione...' : 'Riprova'}
        </button>
        <Link
          href="/tornei"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          Torna ai tornei
        </Link>
      </div>
      </div>
    </div>
  );
}
