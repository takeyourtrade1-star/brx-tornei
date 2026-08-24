'use client';

import { usePathname } from 'next/navigation';
import { GameNavButton } from '@/components/layout/game-nav-button';

const HUD_ART = {
  mazzi: { src: '/images/hud/deck-icon.png', width: 720, height: 264 },
  partite: { src: '/images/hud/games-icon.png', width: 720, height: 265 },
  amici: { src: '/images/hud/friends-icon.png', width: 720, height: 286 },
} as const;

interface GameNavRailProps {
  friendsOpen: boolean;
  onOpenFriends: () => void;
  onlineFriendsCount: number;
  pendingRequestsCount: number;
}

/** Rail destra (desktop) e dock basso (mobile) con i 3 comandi principali. */
export function GameNavRail({
  friendsOpen,
  onOpenFriends,
  onlineFriendsCount,
  pendingRequestsCount,
}: GameNavRailProps) {
  const pathname = usePathname();
  if (pathname.includes('/live')) return null;

  const mazziActive = pathname.startsWith('/mazzi');
  const partiteActive = pathname.startsWith('/partite');

  return (
    <>
      <nav
        aria-label="Navigazione principale tornei"
        className="pointer-events-none fixed right-2 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      >
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          <Buttons
            compact={false}
            mazziActive={mazziActive}
            partiteActive={partiteActive}
            friendsOpen={friendsOpen}
            onOpenFriends={onOpenFriends}
            onlineFriendsCount={onlineFriendsCount}
            pendingRequestsCount={pendingRequestsCount}
          />
        </div>
      </nav>

      <nav
        aria-label="Navigazione principale tornei"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 md:hidden"
      >
        <div className="pointer-events-auto flex items-end justify-center gap-2 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-2 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-5">
          <Buttons
            compact
            mazziActive={mazziActive}
            partiteActive={partiteActive}
            friendsOpen={friendsOpen}
            onOpenFriends={onOpenFriends}
            onlineFriendsCount={onlineFriendsCount}
            pendingRequestsCount={pendingRequestsCount}
          />
        </div>
      </nav>
    </>
  );
}

function Buttons({
  compact,
  mazziActive,
  partiteActive,
  friendsOpen,
  onOpenFriends,
  onlineFriendsCount,
  pendingRequestsCount,
}: {
  compact: boolean;
  mazziActive: boolean;
  partiteActive: boolean;
  friendsOpen: boolean;
  onOpenFriends: () => void;
  onlineFriendsCount: number;
  pendingRequestsCount: number;
}) {
  return (
    <>
      <GameNavButton
        href="/mazzi"
        label="Mazzi"
        ariaLabel="I miei mazzi"
        art={HUD_ART.mazzi}
        active={mazziActive}
        compact={compact}
      />
      <GameNavButton
        href="/partite"
        label="Partite"
        ariaLabel="Le mie partite"
        art={HUD_ART.partite}
        active={partiteActive}
        compact={compact}
      />
      <GameNavButton
        label="Amici"
        ariaLabel="Apri amici e duellanti"
        art={HUD_ART.amici}
        active={friendsOpen}
        compact={compact}
        onlineDot={onlineFriendsCount > 0}
        badge={pendingRequestsCount}
        onClick={onOpenFriends}
      />
    </>
  );
}
