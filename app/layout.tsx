import type { Metadata } from 'next';
import { Almendra_SC, EB_Garamond } from 'next/font/google';
import { config } from '@/lib/config';
import './globals.css';

const almendraSC = Almendra_SC({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-comodo',
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(config.app.siteUrl),
  title: {
    default: 'Ebartex Tornei',
    template: '%s · Ebartex Tornei',
  },
  description:
    'Scegli il torneo a cui vuoi partecipare giocando dalla tua webcam con tutto il mondo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${almendraSC.variable} ${ebGaramond.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

