import Link from 'next/link';
import Image from 'next/image';
import { publicConfig, getCdnImageUrl } from '@/lib/public-config';
import { COMPANY_INFO } from '@/lib/legal/company-info';

const FOOTER_BAND_BG = '#1D3160';

type FooterLink = {
  label: string;
  href: string;
  disabled?: boolean;
  active?: boolean;
  badge?: string;
  external?: boolean;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

export function Footer() {
  const mainSiteUrl = publicConfig.app.mainSiteUrl || 'https://www.ebartex.com';

  const marketplaceColumns: FooterColumn[] = [
    {
      title: 'Lingua del sito',
      links: [
        { label: 'Italiano', href: '#', active: true },
        { label: 'English', href: '#', disabled: true, badge: 'In arrivo' },
        { label: 'Deutsch', href: '#', disabled: true, badge: 'In arrivo' },
        { label: 'Español', href: '#', disabled: true, badge: 'In arrivo' },
        { label: 'Français', href: '#', disabled: true, badge: 'In arrivo' },
        { label: 'Português', href: '#', disabled: true, badge: 'In arrivo' },
      ],
    },
    {
      title: 'Marketplace',
      links: [
        { label: 'Compra carte', href: `${mainSiteUrl}/search`, external: true },
        { label: 'Vendi carte', href: `${mainSiteUrl}/vendi`, external: true },
        { label: 'BRX Express', href: `${mainSiteUrl}/brx-express`, external: true },
        { label: 'Aste live', href: `${mainSiteUrl}/aste`, external: true },
        { label: 'Sincronizzazione', href: `${mainSiteUrl}/account/sincronizzazione`, external: true },
        { label: 'Scambi tra utenti', href: `${mainSiteUrl}/scambi`, external: true },
      ],
    },
    {
      title: 'Aiuto & Note legali',
      links: [
        { label: 'Condizioni generali', href: `${mainSiteUrl}/legal/condizioni`, external: true },
        { label: 'Privacy Policy', href: `${mainSiteUrl}/legal/privacy`, external: true },
        { label: 'Informativa Cookie', href: `${mainSiteUrl}/legal/cookie`, external: true },
        { label: 'Guida all’acquisto', href: `${mainSiteUrl}/aiuto#comprare`, external: true },
        { label: 'FAQ & Assistenza', href: `${mainSiteUrl}/aiuto`, external: true },
      ],
    },
  ];

  const tournamentsColumns: FooterColumn[] = [
    {
      title: 'Arena & Sfide',
      links: [
        { label: 'Lobby Tornei', href: '/tornei' },
        { label: 'Le mie partite', href: '/partite' },
        { label: 'Deck Builder & Mazzi', href: '/mazzi' },
        { label: 'Modalità di gioco', href: '/hub/modalita' },
        { label: 'Tavoli 1v1 & Pods', href: '/tornei' },
      ],
    },
    {
      title: 'Regole & Fair Play',
      links: [
        { label: 'Formati supportati', href: '/hub/modalita' },
        { label: 'Reputazione & Feedback', href: '/partite' },
        { label: 'Video Review Anti-cheat', href: '/partite' },
        { label: 'Setup Webcam & Telefono', href: '/tornei' },
        { label: 'Regolamento Tavolo', href: '/hub/modalita' },
      ],
    },
    {
      title: 'Community & Social',
      links: [
        { label: 'Sfida diretta 1v1', href: '/tornei' },
        { label: 'Lista Amici & Presenza', href: '/tornei' },
        { label: 'Profili & Gamertag', href: '/partite' },
        { label: 'Medaglie & Grado On Fire', href: '/partite' },
        { label: 'Ebartex Journey', href: `${mainSiteUrl}/blog`, external: true },
      ],
    },
  ];

  const renderColumn = (col: FooterColumn) => (
    <div key={col.title}>
      <h3 className="mb-4 border-b-2 border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-gray-900">
        {col.title}
      </h3>
      <ul className="space-y-2.5">
        {col.links.map((link) => (
          <li key={link.label}>
            {link.disabled ? (
              <span className="flex items-center justify-between text-xs sm:text-sm text-gray-400 cursor-not-allowed select-none">
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] uppercase font-semibold text-gray-400/80 tracking-wider">
                    {link.badge}
                  </span>
                )}
              </span>
            ) : link.active ? (
              <span className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#1D3160] cursor-default select-none">
                <span className="flex items-center gap-1.5">
                  <span>{link.label}</span>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF7300]" />
                </span>
                <span className="text-[9px] uppercase font-semibold text-[#FF7300] tracking-wider">
                  Attiva
                </span>
              </span>
            ) : link.external ? (
              <a
                href={link.href}
                className="text-xs sm:text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-xs sm:text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="relative z-10 w-full bg-white text-gray-900 border-t border-gray-200">
      {/* Top Banner diviso: Sinistra Ebartex, Destra Ebartex + Tournaments */}
      <div
        className="px-4 py-4 md:py-6"
        style={{ backgroundColor: FOOTER_BAND_BG }}
      >
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:divide-x md:divide-white/15">
            {/* Metà Sinistra: Logo Ebartex centrato */}
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

            {/* Metà Destra: Logo Ebartex + Tournaments come nell'header */}
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
                <span className="font-sans text-xl font-black uppercase tracking-wider text-[#FF7300] drop-shadow-sm sm:text-2xl md:text-3xl">
                  Tournaments
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Corpo del Footer: 2 Metà (Marketplace a sinistra, Tornei a destra) */}
      <div className="border-t-4 border-[#FF7300] bg-white px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] px-4 md:px-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:divide-x lg:divide-gray-200">
            {/* Metà Sinistra: Ebartex Marketplace */}
            <div className="flex flex-col">
              <div className="mb-6 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1D3160]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-[#1D3160]">
                  Ebartex Marketplace
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
                {marketplaceColumns.map(renderColumn)}
              </div>
            </div>

            {/* Metà Destra: Ebartex Tornei */}
            <div className="flex flex-col lg:pl-16">
              <div className="mb-6 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FF7300]" />
                <h2 className="text-xs font-black uppercase tracking-widest text-[#FF7300]">
                  Ebartex Tournaments
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
                {tournamentsColumns.map(renderColumn)}
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

