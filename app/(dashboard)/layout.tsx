import type { ReactNode } from 'react';

/**
 * Shell della dashboard: nessun container qui — l'header (full-width,
 * .header-gradient) e il contenuto contenuto vivono nella pagina, perché
 * dipendono dai searchParams che i layout non ricevono.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
