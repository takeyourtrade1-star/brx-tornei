'use client';

import { WebcamLinkModal } from './webcam-link-modal';
import { TournamentRequestSentModal } from './tournament-request-sent-modal';
import { JoinTournamentDeckModal } from './join-tournament-deck-modal';
import type { Tournament } from '@/types/tournament';

interface TournamentLiveModalsProps {
  webcamOpen: boolean;
  externalSessionId?: string;
  busy: boolean;
  confirmLabel: string;
  showSkip: boolean;
  requestSent: string | null;
  joinDeckTournament: Tournament | null;
  onConfirm: () => void;
  onCancel: () => void;
  onSkip?: () => void;
  onCloseRequestSent: () => void;
  onCloseJoinDeck: () => void;
  onDeckJoinComplete: (result: { matchId?: string }) => void;
}

/** Modali condivise tra dashboard e minigioco (webcam + join mazzo + richiesta privata). */
export function TournamentLiveModals({
  webcamOpen,
  externalSessionId,
  busy,
  confirmLabel,
  showSkip,
  requestSent,
  joinDeckTournament,
  onConfirm,
  onCancel,
  onSkip,
  onCloseRequestSent,
  onCloseJoinDeck,
  onDeckJoinComplete,
}: TournamentLiveModalsProps) {
  return (
    <>
      <JoinTournamentDeckModal
        open={joinDeckTournament !== null}
        tournament={joinDeckTournament}
        onClose={onCloseJoinDeck}
        onJoined={onDeckJoinComplete}
      />

      <WebcamLinkModal
        open={webcamOpen}
        externalSessionId={externalSessionId}
        busy={busy}
        confirmLabel={confirmLabel}
        onConfirm={onConfirm}
        onCancel={onCancel}
        onSkip={showSkip ? onSkip : undefined}
      />

      <TournamentRequestSentModal
        open={!!requestSent}
        requestLabel={requestSent ?? ''}
        onClose={onCloseRequestSent}
      />
    </>
  );
}
