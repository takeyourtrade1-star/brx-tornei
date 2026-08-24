import type { ReactNode } from 'react';
import { ArenaAtmosphere } from '@/components/layout/arena-atmosphere';
import { SiteHeader } from '@/components/layout/SiteHeader';

/** Shell dell'hub di selezione: header stile Ebartex + contenuto centrato. */
export default function HubLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <ArenaAtmosphere />
      <div className="relative z-[1]">
        <SiteHeader />
        <main className="mx-auto w-full max-w-content px-4 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
