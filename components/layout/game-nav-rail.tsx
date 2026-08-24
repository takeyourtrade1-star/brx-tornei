'use client';

import { usePathname } from 'next/navigation';
import { Layers, Swords, Users } from 'lucide-react';
import { GameNavButton } from '@/components/layout/game-nav-button';

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
        className="pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 md:block"
      >
        <div className="pointer-events-auto flex flex-col gap-3.5">
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
        <div className="pointer-events-auto flex items-end justify-center gap-2.5 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5">
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
        icon={Layers}
        tone="orange"
        active={mazziActive}
        compact={compact}
      />
      <GameNavButton
        href="/partite"
        label="Partite"
        ariaLabel="Le mie partite"
        icon={Swords}
        tone="gold"
        active={partiteActive}
        compact={compact}
      />
      <GameNavButton
        label="Amici"
        ariaLabel="Apri amici e duellanti"
        icon={Users}
        tone="blue"
        active={friendsOpen}
        compact={compact}
        onlineDot={onlineFriendsCount > 0}
        badge={pendingRequestsCount}
        onClick={onOpenFriends}
      />
    </>
  );
}
