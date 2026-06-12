import { ArrowLeftRight, Monitor, Smartphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/** Teaser per streaming video/audio dal telefono mentre si gioca dal PC. */
export function PhoneStreamTeaser() {
  return (
    <section
      className="brx-glass relative overflow-hidden rounded-2xl border border-white/15 p-5"
      aria-labelledby="phone-stream-teaser-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-marquee/8 via-transparent to-primary/5"
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06]">
            <Monitor className="h-5 w-5 text-white/80" aria-hidden />
          </div>
          <ArrowLeftRight className="h-4 w-4 text-marquee" aria-hidden />
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-marquee/25 bg-marquee/10">
            <Smartphone className="h-5 w-5 text-marquee" aria-hidden />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="phone-stream-teaser-title"
              className="font-sans text-base font-bold text-white sm:text-lg"
            >
              Gioca al PC, trasmetti dal telefono
            </h2>
            <Badge
              variant="warning"
              className="shrink-0 border-amber-500/30 bg-amber-500/20 font-sans font-bold text-amber-300"
            >
              Presto in arrivo
            </Badge>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/60">
            Collega il cellulare come videocamera e microfono mentre giochi dal computer. Video e
            audio sincronizzati in tempo reale, con latenza minima — per sentirti davvero al tavolo
            con l&apos;avversario.
          </p>
        </div>
      </div>
    </section>
  );
}
