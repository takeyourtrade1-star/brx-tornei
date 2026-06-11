import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import { config } from '@/lib/config';
import './globals.css';

/** Stesso font principale di Ebartex (--font-sans nel preset). */
const nunito = Nunito({
  subsets: ['latin'],
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
    <html lang="it" className={nunito.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
