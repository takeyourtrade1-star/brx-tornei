import { Swords } from 'lucide-react';

/** Stato vuoto lista tornei — invita a creare il primo torneo. */
export function TournamentsEmptyState() {
  return (
    <div className="brx-glass flex flex-col items-center rounded-3xl border border-white/15 px-6 py-14 text-center sm:py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
        <Swords className="h-7 w-7 text-marquee" aria-hidden />
      </div>
      <p className="mt-5 font-sans text-xl font-bold uppercase tracking-wide text-white/90">
        Nessun torneo disponibile
      </p>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
        Non ci sono tornei per questa selezione. Sii il primo a crearne uno con il pulsante
        &ldquo;Crea Torneo&rdquo;.
      </p>
    </div>
  );
}
