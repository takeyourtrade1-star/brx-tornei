import type { Metadata } from 'next';
import { config } from '@/lib/config';
import { AuthRefreshReconciler } from '@/components/feature/auth/auth-refresh-reconciler';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(config.app.siteUrl),
  title: {
    default: 'Ebartex Tornei',
    template: '%s · Ebartex Tornei',
  },
  description:
    'Scegli il torneo a cui vuoi partecipare giocando dalla tua webcam con tutto il mondo.',
};

// Next applica il nonce del request header agli script di bootstrap soltanto
// durante rendering per-request; le pagine non devono essere prerenderizzate.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="font-sans antialiased">
        {children}
        <AuthRefreshReconciler />
      </body>
    </html>
  );
}
