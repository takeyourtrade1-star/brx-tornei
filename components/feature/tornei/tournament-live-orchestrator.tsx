'use client';

import { useTournamentLiveFlow } from '@/hooks/use-tournament-live-flow';
import { TournamentLiveModals } from './tournament-live-modals';
import { TournamentsDashboard } from './tournaments-dashboard';
import type { FormatId } from '@/lib/data/catalog';
import type { Selection } from '@/lib/validations/selection';
import type { Tournament } from '@/types/tournament';

interface TournamentLiveOrchestratorProps {
  tournaments: Tournament[];
  selection: Selection;
  formatId: FormatId;
  formatName: string;
  modeName: string;
  mobile?: boolean;
}

export function TournamentLiveOrchestrator({
  tournaments,
  selection,
  formatId,
  formatName,
  modeName,
  mobile = false,
}: TournamentLiveOrchestratorProps) {
  const flow = useTournamentLiveFlow(tournaments);

  return (
    <>
      <TournamentsDashboard
        tournaments={tournaments}
        selection={selection}
        formatId={formatId}
        formatName={formatName}
        modeName={modeName}
        mobile={mobile}
        onTournamentCreated={flow.handleTournamentCreated}
        onJoinTournament={flow.handleJoinTournament}
        onObserveTournament={flow.handleObserveTournament}
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
