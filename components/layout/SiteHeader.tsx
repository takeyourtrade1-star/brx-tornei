import { config } from '@/lib/config';import { BrxHeaderLogo } from '@/components/layout/brx-header-logo';

/**
 * Header del sito (hub e pagine generiche) — linguaggio visivo dell'header Ebartex:
 * .header-gradient (blu sfumato a trasparente), font-display, logo corto BRX da CDN.
 */
export function SiteHeader() {
  return (
    <header className="header-gradient sticky top-0 z-50 w-full pb-6 font-sans text-white">
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2 sm:px-6">
        <div className="flex items-center gap-2 overflow-visible py-1">
          <BrxHeaderLogo ariaLabel="Ebartex Tornei — home" />
          <span className="hidden text-lg uppercase tracking-wide sm:inline font-bold">
            <span className="text-primary">League</span>
          </span>
        </div>

        <a
          href={config.app.mainSiteUrl}
          className="ml-auto rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wide ring-1 ring-white/20 transition-colors hover:bg-white/20"
        >
          ← Torna su Ebartex
        </a>
      </div>
    </header>
  );
}
