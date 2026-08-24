import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { ArenaAtmosphere } from '@/components/layout/arena-atmosphere';
import { GameHudOffset } from '@/components/layout/game-hud-offset';
import { ReturnToMatchBanner } from '@/components/feature/tornei/return-to-match-banner';
import { AddFriendFromQuery } from '@/components/feature/social/add-friend-from-query';

/**
 * Shell della dashboard: nessun container qui — l'header (full-width,
 * .header-gradient) e il contenuto contenuto vivono nella pagina, perché
 * dipendono dai searchParams che i layout non ricevono.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <ArenaAtmosphere />
      <div className="relative z-[1]">
        <GameHudOffset>
          {children}
          {/* Richiamo globale alla partita in corso, nascosto nella pagina live. */}
          <ReturnToMatchBanner />
          <Suspense fallback={null}>
            <AddFriendFromQuery />
          </Suspense>
        </GameHudOffset>
      </div>
    </div>
  );
}
