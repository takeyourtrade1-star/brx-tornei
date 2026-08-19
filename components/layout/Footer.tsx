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

  const columns: FooterColumn[] = [
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
      title: 'Funzionalità',
      links: [
        { label: 'Compra carte', href: `${mainSiteUrl}/search`, external: true },
        { label: 'Vendi carte', href: `${mainSiteUrl}/vendi`, external: true },
        { label: 'BRX Express', href: `${mainSiteUrl}/brx-express`, external: true },
        { label: 'Aste live', href: `${mainSiteUrl}/aste`, external: true },
        { label: 'Tornei', href: '/tornei' },
        { label: 'Sincronizzazione', href: `${mainSiteUrl}/account/sincronizzazione`, external: true },
        { label: 'Scambi', href: `${mainSiteUrl}/scambi`, external: true },
      ],
    },
    {
      title: 'Aiuto & Regolamento',
      links: [
        { label: 'Condizioni di vendita', href: `${mainSiteUrl}/legal/condizioni`, external: true },
        { label: 'Privacy Policy', href: `${mainSiteUrl}/legal/privacy`, external: true },
        { label: 'Informativa Cookie', href: `${mainSiteUrl}/legal/cookie`, external: true },
        { label: 'FAQ & Assistenza', href: `${mainSiteUrl}/aiuto`, external: true },
      ],
    },
    {
      title: 'Guide',
      links: [
        { label: 'Condizioni d’uso', href: `${mainSiteUrl}/aiuto#condizioni`, external: true },
        { label: 'Guida all’acquisto', href: `${mainSiteUrl}/aiuto#comprare`, external: true },
        { label: 'Guida alla spedizione', href: `${mainSiteUrl}/aiuto#spedizione`, external: true },
      ],
    },
    {
      title: 'Giochi',
      links: [
        { label: 'Magic: The Gathering', href: `${mainSiteUrl}/products?game=magic`, external: true },
        { label: 'Pokémon TCG', href: '#', disabled: true, badge: 'In arrivo' },
        { label: 'Yu-Gi-Oh!', href: '#', disabled: true, badge: 'In arrivo' },
      ],
    },
  ];

  return (
    <footer className="relative z-10 w-full bg-white text-gray-900 border-t border-gray-200">
      <div
        className="flex items-center justify-center px-4 py-3 md:py-4"
        style={{ backgroundColor: FOOTER_BAND_BG }}
      >
        <a href={mainSiteUrl} className="flex items-center" aria-label="Ebartex Home">
          <Image
            src={getCdnImageUrl('Logo%20Principale%20EBARTEX.png')}
            alt="Ebartex"
            width={320}
            height={128}
            className="h-16 w-auto drop-shadow-sm md:h-20"
            unoptimized
          />
        </a>
      </div>

      <div className="border-t-4 border-[#FF7300] bg-white px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-7xl 2xl:max-w-[100rem] 3xl:max-w-[120rem] px-4 md:px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 border-b-2 border-[#FF7300]/60 pb-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.disabled ? (
                        <span className="flex items-center justify-between text-sm text-gray-400 cursor-not-allowed select-none">
                          <span>{link.label}</span>
                          {link.badge && (
                            <span className="text-[10px] uppercase font-semibold text-gray-400/80 tracking-wider">
                              {link.badge}
                            </span>
                          )}
                        </span>
                      ) : link.active ? (
                        <span className="flex items-center justify-between text-sm font-bold text-[#1D3160] cursor-default select-none">
                          <span className="flex items-center gap-1.5">
                            <span>{link.label}</span>
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF7300]" />
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-[#FF7300] tracking-wider">
                            Attiva
                          </span>
                        </span>
                      ) : link.external ? (
                        <a
                          href={link.href}
                          className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-gray-600 transition-colors hover:text-[#FF7300]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center border-t border-gray-200 bg-white px-4 py-6 text-center md:px-6">
        <p className="mb-3 max-w-5xl text-xs leading-relaxed text-gray-500">
          Tutti i marchi, i nomi dei giochi e le immagini delle carte sono di proprietà dei rispettivi titolari. Ebartex è un servizio indipendente e non è affiliato, sponsorizzato o approvato da Wizards of the Coast, Nintendo o altri produttori.
        </p>
        <p className="mb-3 max-w-3xl text-xs leading-relaxed text-gray-500">
          {COMPANY_INFO.legalName} — {COMPANY_INFO.legalForm} — Sede legale: {COMPANY_INFO.legalAddress} — P.IVA/C.F. {COMPANY_INFO.vatNumber} — REA {COMPANY_INFO.rea} — PEC {COMPANY_INFO.pec}
        </p>
        <span className="text-sm font-medium text-gray-700 flex flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
          <span>© {new Date().getFullYear()} Ebartex</span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span>Fatto con cura ad Ivrea</span>
        </span>
      </div>
    </footer>
  );
}
