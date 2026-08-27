import Link from 'next/link';
import Image from 'next/image';
import { publicConfig, getCdnImageUrl } from '@/lib/public-config';
import { COMPANY_INFO } from '@/lib/legal/company-info';

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

function FooterColumnLinks({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-gray-900">
        {column.title}
      </h3>
      <ul className="space-y-2.5">
        {column.links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                className="text-xs text-gray-600 transition-colors hover:text-primary-text sm:text-sm"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-xs text-gray-600 transition-colors hover:text-primary-text sm:text-sm"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const mainSiteUrl = publicConfig.app.mainSiteUrl || 'https://www.ebartex.com';

  const marketplaceColumns: FooterColumn[] = [
    {
      title: 'Marketplace',
      links: [
        { label: 'Compra carte', href: `${mainSiteUrl}/search`, external: true },
        { label: 'Vendi carte', href: `${mainSiteUrl}/vendi`, external: true },
        { label: 'BRX Express', href: `${mainSiteUrl}/brx-express`, external: true },
        { label: 'Aste live', href: `${mainSiteUrl}/aste`, external: true },
        { label: 'Scambi tra utenti', href: `${mainSiteUrl}/scambi`, external: true },
      ],
    },
    {
      title: 'Supporto & legale',
      links: [
        { label: 'FAQ e assistenza', href: `${mainSiteUrl}/aiuto`, external: true },
        { label: 'Condizioni generali', href: `${mainSiteUrl}/legal/condizioni`, external: true },
        { label: 'Privacy Policy', href: `${mainSiteUrl}/legal/privacy`, external: true },
        { label: 'Informativa Cookie', href: `${mainSiteUrl}/legal/cookie`, external: true },
      ],
    },
  ];

  const tournamentsColumn: FooterColumn = {
    title: 'Gioca',
    links: [
      { label: 'Lobby tornei', href: '/tornei' },
      { label: 'I miei mazzi', href: '/mazzi' },
      { label: 'Le mie partite', href: '/partite' },
    ],
  };

  return (
    <footer className="relative z-10 w-full bg-white text-gray-900 border-t border-gray-200">
      {/* Fascia brand divisa tra Marketplace e Tournaments. */}
      <div className="bg-global-bg-end px-4 py-4 md:py-6">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:divide-x md:divide-white/15">
            <div className="flex items-center justify-center md:pr-8">
              <a
                href={mainSiteUrl}
                className="flex items-center justify-center transition-opacity hover:opacity-90"
                aria-label="Ebartex Marketplace"
              >
                <Image
                  src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
                  alt="Ebartex"
                  width={280}
                  height={112}
                  className="h-12 w-auto drop-shadow-sm md:h-16"
                  unoptimized
                />
              </a>
            </div>

            <div className="flex items-center justify-center md:pl-8">
              <Link
                href="/tornei"
                className="group flex items-center justify-center gap-2.5 sm:gap-3.5 transition-opacity hover:opacity-90"
                aria-label="Ebartex Tournaments"
              >
                <Image
                  src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
                  alt="Ebartex"
                  width={280}
                  height={112}
                  className="h-12 w-auto drop-shadow-sm md:h-16"
                  unoptimized
                />
                <span className="font-sans text-xl font-black uppercase tracking-wider text-primary drop-shadow-sm sm:text-2xl md:text-3xl">
                  Tournaments
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pochi collegamenti essenziali, raggruppati per destinazione reale. */}
      <div className="border-t-4 border-primary bg-white px-4 py-10 md:px-6 md:py-12">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] px-4 md:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:divide-x lg:divide-gray-200">
            <div className="flex flex-col">
              <div className="mb-6 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-global-bg-end" />
                <h2 className="text-xs font-black uppercase tracking-widest text-global-bg-end">
                  Ebartex Marketplace
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                {marketplaceColumns.map((column) => (
                  <FooterColumnLinks key={column.title} column={column} />
                ))}
              </div>
            </div>

            <div className="flex flex-col lg:pl-16">
              <div className="mb-6 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <h2 className="text-xs font-black uppercase tracking-widest text-primary-text">
                  Ebartex Tournaments
                </h2>
              </div>
              <div className="max-w-sm">
                <FooterColumnLinks column={tournamentsColumn} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fascia Inferiore: Note legali, copyright & Made in Ivrea */}
      <div className="flex flex-col items-center justify-center border-t border-gray-200 bg-white px-4 py-6 text-center md:px-6">
        <p className="mb-3 max-w-5xl text-xs leading-relaxed text-gray-500">
          Tutti i marchi, i nomi dei giochi e le immagini delle carte sono di proprietà dei rispettivi titolari. Ebartex è un servizio indipendente e non è affiliato, sponsorizzato o approvato da Wizards of the Coast, Nintendo o altri produttori.
        </p>
        <p className="mb-3 max-w-3xl text-xs leading-relaxed text-gray-500">
          {COMPANY_INFO.legalName} — {COMPANY_INFO.legalForm} — Sede legale: {COMPANY_INFO.legalAddress} — P.IVA/C.F. {COMPANY_INFO.vatNumber} — REA {COMPANY_INFO.rea} — PEC {COMPANY_INFO.pec}
        </p>
        <span className="text-sm font-medium text-gray-700 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
          <span>© {new Date().getFullYear()} Ebartex. Tutti i diritti riservati.</span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span>Fatto col ❤️ a Ivrea, terra di idee iconiche.</span>
        </span>
      </div>
    </footer>
  );
}
