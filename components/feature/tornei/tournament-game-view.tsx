'use client';

import { useEffect, useState } from 'react';
import { useTournamentLiveFlow } from '@/hooks/use-tournament-live-flow';
import { TournamentLiveModals } from './tournament-live-modals';
import { TournamentGameCanvas } from './tournament-game-canvas';
import { TournamentSimpleView } from './tournament-simple-view';
import type { FormatId, ModeId } from '@/lib/data/catalog';
import type { InventoryItem } from '@/types/inventory';
import type { Selection } from '@/lib/validations/selection';
import type { Tournament } from '@/types/tournament';

interface TournamentGameViewProps {
  tournaments: Tournament[];
  inventory: InventoryItem[];
  selection: Selection;
  user: { name?: string | null; email: string };
  formatId: string;
  formatName: string;
  modeName: string;
}

export function TournamentGameView({
  tournaments,
  inventory,
  selection,
  user,
  formatId,
  formatName,
  modeName,
}: TournamentGameViewProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [simpleView, setSimpleView] = useState(true);
  const flow = useTournamentLiveFlow(tournaments);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile === null) {
    return (
      <div className="min-h-screen" aria-busy="true" aria-label="Caricamento tornei">
        <div className="header-gradient h-20 w-full" />
        <div className="mx-auto mt-4 flex w-full max-w-content flex-col gap-6 px-4 sm:px-6">
          <div className="flex items-end justify-between">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-white/10" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-white/10" />
          </div>
          <div className="simple-panel h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  if (isMobile || simpleView) {
    return (
      <TournamentSimpleView
        user={user}
        isMobile={isMobile}
        showMinigameBack={simpleView && !isMobile}
        onBackToMinigame={() => setSimpleView(false)}
        tournaments={tournaments}
        selection={selection}
        formatId={formatId as FormatId}
        formatName={formatName}
        modeName={modeName}
      />
    );
  }

  return (
    <>
      <TournamentGameCanvas
        user={user}
        formatId={formatId as FormatId}
        formatName={formatName}
        modeId={selection.mode as ModeId}
        modeName={modeName}
        tournaments={tournaments}
        inventory={inventory}
        onCreateTournament={flow.handleCreateFromGame}
        onJoinTournament={flow.handleJoinTournament}
        onObserveTournament={flow.handleObserveTournament}
        onExitToSimple={() => setSimpleView(true)}
      />

      <TournamentLiveModals
        webcamOpen={flow.webcamOpen}
        externalSessionId={flow.externalSessionId}
        busy={flow.busy}
        confirmLabel={flow.confirmLabel}
        showSkip={flow.showSkip}
        requestSent={flow.requestSent}
        joinDeckTournament={flow.joinDeckTournament}
        onConfirm={flow.confirmPending}
        onCancel={flow.cancelPending}
        onSkip={flow.skipWebcam}
        onCloseRequestSent={flow.closeRequestSent}
        onCloseJoinDeck={flow.closeJoinDeckModal}
        onDeckJoinComplete={flow.handleDeckJoinComplete}
      />
    </>
  );
}
