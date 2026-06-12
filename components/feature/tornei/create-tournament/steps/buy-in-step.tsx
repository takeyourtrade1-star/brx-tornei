import { Sparkles } from 'lucide-react';
import { WizardOptionCard } from '../wizard-option-card';

export function BuyInStep() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-sans text-xl font-bold uppercase tracking-wide text-white">
          Buy-in
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Per ora è disponibile solo la modalità gratuita. I tornei a pagamento arriveranno presto.
        </p>
      </div>

      <WizardOptionCard
        title="For Fun"
        description="Torneo gratuito, senza buy-in in denaro. Ideale per partite amichevoli e test."
        selected
        disabled
        badge="Unica opzione"
      />

      <p className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/55 ring-1 ring-white/10">
        <Sparkles className="h-4 w-4 shrink-0 text-marquee" aria-hidden />
        Il buy-in è bloccato su For Fun per questa versione del sito.
      </p>
    </section>
  );
}
