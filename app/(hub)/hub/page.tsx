import type { Metadata } from 'next';
import { FORMATS, MODES, getFormat } from '@/lib/data/catalog';
import { ModeCard } from '@/components/feature/hub/selection-card';
import { FormatSelectorFan } from '@/components/feature/hub/format-selector-fan';

export const metadata: Metadata = { title: 'Scegli il torneo' };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Pagina Tornei (dal mockup): Step 1 scegli il FORMATO; appena selezionato,
 * sotto appare lo Step 2 "scegli la modalità". Tutto server-side, zero JS client:
 * la selezione vive nell'URL (?format=...).
 */
export default async function HubPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selected = getFormat(typeof params.format === 'string' ? params.format : '');

  return (
    <section className="flex flex-col gap-10 pb-16">
      {/* Hero — titolo del mockup */}
      <div className="pt-6 text-center">
        <h1 className="font-display text-4xl uppercase leading-tight tracking-wide text-white drop-shadow-lg sm:text-5xl">
          Scegli il torneo a cui vuoi{' '}
          <span className="text-primary">partecipare</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
          giocando dalla tua webcam con tutto il mondo
        </p>
      </div>

      {/* Step 1: formato */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-white">
            1
          </span>
          <h2 className="font-display text-2xl uppercase tracking-wide text-white">
            Scegli il formato
          </h2>
        </div>
        <FormatSelectorFan formats={FORMATS} selectedId={selected?.id} />
      </div>

      {/* Step 2: modalità — appare solo dopo la selezione del formato (come da mockup) */}
      {selected && (
        <div
          id="modalita"
          className="brx-glass animate-auth-enter rounded-3xl border border-white/15 p-6 sm:p-8"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-white">
              2
            </span>
            <h2 className="font-display text-2xl uppercase tracking-wide text-white">
              Scegli la modalità
            </h2>
            <span className="ml-auto rounded-full bg-white/10 px-4 py-1 font-display uppercase tracking-wide text-marquee">
              {selected.name}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {MODES.map((mode, i) => (
              <ModeCard
                key={mode.id}
                title={mode.name}
                description={mode.description}
                href={`/tornei?format=${selected.id}&mode=${mode.id}`}
                available={mode.available}
                badge={mode.badge}
                index={i}
              />
            ))}
            {/* Terza card del mockup: crea il tuo torneo personale (porta alla dashboard) */}
            <ModeCard
              title="Crea il tuo torneo"
              description="Regole e inviti su misura, in modalità Heads-Up"
              href={`/tornei?format=${selected.id}&mode=heads-up`}
              available
              index={MODES.length}
            />
          </div>
        </div>
      )}
    </section>
  );
}
