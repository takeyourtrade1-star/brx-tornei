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
        <h1 className="font-display text-4xl font-black uppercase leading-tight tracking-wide text-white drop-shadow-lg sm:text-5xl">
          Scegli il torneo a cui vuoi{' '}
          <span className="text-primary">partecipare</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
          Gioca da casa, vivi l’adrenalina di una vera partita.
        </p>
      </div>

      {/* Step 1: formato */}
      <div>
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full brx-liquid-glass-circle font-sans font-bold text-white">
            1
          </span>
          <h2 className="font-sans text-2xl font-bold uppercase tracking-wide text-white">
            Scegli il formato
          </h2>
        </div>
        <FormatSelectorFan formats={FORMATS} selectedId={selected?.id} />
      </div>

      {/* Step 2: modalità — appare solo dopo la selezione del formato (come da mockup) */}
      {selected && (
        <div id="modalita" className="animate-auth-enter flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full brx-liquid-glass-circle font-sans font-bold text-white">
              2
            </span>
            <h2 className="font-sans text-2xl font-bold uppercase tracking-wide text-white">
              Scegli la modalità
            </h2>
            <span className="ml-auto rounded-full bg-white/10 px-4 py-1 font-sans text-xs font-bold uppercase tracking-wider text-marquee">
              {selected.name}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 group/grid">
            {MODES.map((mode, i) => (
              <ModeCard
                key={mode.id}
                title={mode.name}
                description={mode.description}
                href={`/tornei?format=${selected.id}&mode=${mode.id}`}
                available={mode.available}
                badge={mode.badge}
                index={i}
                bgImage={mode.id === 'heads-up' ? '/images/modes/heads-up.jpeg' : '/images/modes/torneo.jpeg'}
                accent={mode.id === 'heads-up' ? '#FF7300' : '#C89CFF'}
              />
            ))}
            {/* Terza card del mockup: crea il tuo torneo personale (porta alla dashboard) */}
            <ModeCard
              title="Crea il tuo torneo"
              description="Regole e inviti su misura, in modalità Heads-Up"
              href={`/tornei/nuovo?format=${selected.id}&mode=heads-up`}
              available
              index={MODES.length}
              bgImage="/images/modes/crea-partita.jpeg"
              accent="#4EEAEC"
            />
          </div>
        </div>
      )}
    </section>
  );
}

