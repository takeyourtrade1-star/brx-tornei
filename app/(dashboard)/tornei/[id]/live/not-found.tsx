import Link from 'next/link';

export default function TournamentLiveNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg items-center px-4">
      <div className="simple-panel flex w-full flex-col items-center px-6 py-12 text-center">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-white">
          Partita non trovata
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          Il torneo non esiste o non è più disponibile. In locale, senza{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">NEXT_PUBLIC_TOURNAMENTS_API_URL</code>
          , i dati vivono solo in memoria: un riavvio del dev server può azzerarli.
        </p>
        <Link
          href="/tornei"
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Torna ai tornei
        </Link>
      </div>
    </div>
  );
}
