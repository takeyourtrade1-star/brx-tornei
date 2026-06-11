import Link from 'next/link';
import Image from 'next/image';
import { config, getCdnImageUrl } from '@/lib/config';

/**
 * Header del sito (hub e pagine generiche) — linguaggio visivo dell'header Ebartex:
 * .header-gradient (blu sfumato a trasparente), font-display, logo da CDN.
 */
export function SiteHeader() {
  const logoUrl = getCdnImageUrl('logo.png');

  return (
    <header className="header-gradient sticky top-0 z-50 w-full pb-6 font-display text-white">
      <div className="mx-auto flex max-w-content items-center gap-3 px-4 py-2 sm:px-6">
        <Link
          href="/"
          aria-label="Ebartex Tornei — home"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Image
            src={logoUrl}
            alt="Ebartex"
            width={120}
            height={52}
            className="h-[3.25rem] w-auto object-contain"
            priority
            unoptimized
          />
          <span className="hidden text-lg uppercase tracking-wide sm:inline">
            Ebartex <span className="text-primary">League</span>
          </span>
        </Link>

        <a
          href={config.app.mainSiteUrl}
          className="ml-auto rounded-full bg-white/10 px-4 py-1.5 text-sm uppercase tracking-wide ring-1 ring-white/20 transition-colors hover:bg-white/20"
        >
          ← Torna su Ebartex
        </a>
      </div>
    </header>
  );
}
