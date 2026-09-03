'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import type { SessionUser } from '@/types/auth';
import type { Deck } from '@/types/deck';
import type { PlaymatId } from '@/lib/playmats';
import type { ReputationSummary } from '@/lib/data/player-api-client';
import type { NotificationSnapshot } from '@/types/notification';
import { DeckWorkspace } from './deck-workspace';

interface MazziWorkspaceProps {
  initialDecks: Deck[];
  user: SessionUser;
  /** Gamertag torneo-only mostrato nell'header al posto di email/username. */
  gamertag?: string;
  defaultPlaymatId: PlaymatId;
  homeBackgroundEnabled: boolean;
  reputation?: ReputationSummary | null;
  initialNotifications: NotificationSnapshot;
}

export function MazziWorkspace({
  initialDecks,
  user,
  gamertag,
  defaultPlaymatId,
  homeBackgroundEnabled,
  reputation,
  initialNotifications,
}: MazziWorkspaceProps) {
  return (
    <div className="relative min-h-screen">
      <DashboardHeader
        user={user}
        displayName={gamertag}
        reputation={reputation}
        initialNotifications={initialNotifications}
      />

      <div className="mx-auto w-full max-w-content px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-4">
          <Link href="/tornei" className="arena-back">
            <ArrowLeft className="h-3.5 w-3.5" />
            Torna ai tornei
          </Link>
        </div>
        <DeckWorkspace initialDecks={initialDecks}
          defaultPlaymatId={defaultPlaymatId}
          homeBackgroundEnabled={homeBackgroundEnabled}
          qualifyingMatches={reputation?.qualifiedMatches30m ?? 0}
        />
      </div>
    </div>
  );
}
