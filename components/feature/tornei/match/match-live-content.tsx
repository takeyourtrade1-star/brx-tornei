import type { Dispatch, SetStateAction } from 'react';
import type { useDeclareResult } from '@/hooks/use-declare-result';
import type { useLeaveMatch } from '@/hooks/use-leave-match';
import type { useMatchChat } from '@/hooks/use-match-chat';
import type { useMatchExitFlow } from '@/hooks/use-match-exit-flow';
import type { useMatchGapRecorder } from '@/hooks/use-match-gap-recorder';
import type { useMatchLife } from '@/hooks/use-match-life';
import type { useMatchReady } from '@/hooks/use-match-ready';
import type { useMatchStartCountdown } from '@/hooks/use-match-start-countdown';
import type { useMatchStickerShot } from '@/hooks/use-match-sticker-shot';
import { getFormat, getMode } from '@/lib/data/catalog';
import type { PlaymatId } from '@/lib/playmats';
import { publicConfig } from '@/lib/public-config';
import type { PeerTransport } from '@/lib/webrtc/match-peer-link';
import type { PeerLinkState } from '@/lib/webrtc/match-peer-types';
import type { ConnectionQuality, Participant, Tournament } from '@/types/tournament';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchGapPeerReview } from './match-gap-peer-review';
import { MatchGapProtectionNotice } from './match-gap-protection-notice';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
import {
  MatchConnectionNotice,
  MatchDeclinedPanel,
  MatchEndedPanel,
  MatchErrorNotice,
  MatchResultPendingPanel,
} from './match-live-notices';
import { reconnectingLabel } from './match-live-parts';
import { MatchReadyPanel } from './match-ready-panel';
import { MatchVideoGrid } from './match-video-grid';

interface MatchLiveContentProps {
  tournament: Tournament; me: string; userId: string; isHost: boolean;
  defaultPlaymatId: PlaymatId; isObserver: boolean; isPlayer: boolean; started: boolean;
  matchEnded: boolean; resultClaimPending: boolean; resultReselectionRequired: boolean;
  showResultPanel: boolean; iClaimedResult: boolean; resultCountdown: number | null;
  reconnectGraceActive: boolean; disconnectedIsMe: boolean; didIWin: boolean | undefined;
  local: Participant; remote: Participant; players: [Participant, Participant];
  leftPlayer: Participant; rightPlayer: Participant; playable: boolean;
  localStream: MediaStream | null; remoteStream: MediaStream | null; feedLabel?: string;
  webcamError: string | null; camOn: boolean; micOn: boolean; fullscreenOpen: boolean;
  setCamOn: Dispatch<SetStateAction<boolean>>; setMicOn: Dispatch<SetStateAction<boolean>>;
  setFullscreenOpen: Dispatch<SetStateAction<boolean>>; peerState: PeerLinkState;
  peerError: string | null; peerTransport: PeerTransport; peerQuality?: ConnectionQuality;
  peerReconnecting: boolean; peerConnecting: boolean; retryPeer: () => void;
  ready: ReturnType<typeof useMatchReady>; leave: ReturnType<typeof useLeaveMatch>;
  declareResult: ReturnType<typeof useDeclareResult>; exit: ReturnType<typeof useMatchExitFlow>;
  chat: ReturnType<typeof useMatchChat>; life: ReturnType<typeof useMatchLife>;
  startCountdown: ReturnType<typeof useMatchStartCountdown>;
  sticker: ReturnType<typeof useMatchStickerShot>; gapProtection: ReturnType<typeof useMatchGapRecorder>;
}

export function MatchLiveContent(props: MatchLiveContentProps) {
  const {
    tournament, me, userId, isHost, defaultPlaymatId, isObserver, isPlayer, started,
    matchEnded, resultClaimPending, resultReselectionRequired, showResultPanel,
    iClaimedResult, resultCountdown, reconnectGraceActive, disconnectedIsMe, didIWin,
    local, remote, players, leftPlayer, rightPlayer, playable, localStream, remoteStream,
    feedLabel, webcamError, camOn, micOn, fullscreenOpen, setCamOn, setMicOn,
    setFullscreenOpen, peerState, peerError, peerTransport, peerQuality, peerReconnecting,
    peerConnecting, retryPeer, ready, leave, declareResult, exit, chat, life,
    startCountdown, sticker, gapProtection,
  } = props;
  const participantNames = Object.fromEntries(
    tournament.participants.map((participant) => [participant.id, participant.username]),
  );
  const chatPanelProps = {
    me, userId, messages: chat.messages, send: chat.send,
    connectionState: chat.connectionState, error: chat.error,
    onRetry: chat.retry, participantNames,
  };
  const remoteEmptyLabel = peerReconnecting
    ? reconnectingLabel(remote.username, disconnectedIsMe) : undefined;
  const visiblePeerError = peerReconnecting || peerState === 'peer-left' ? null : peerError;
  const visibleError = leave.error ?? webcamError ?? visiblePeerError ?? declareResult.error;
  const showLiveNotices = !matchEnded;
  const modeName = getMode(tournament.mode)?.name ?? tournament.mode;
  const formatName = getFormat(tournament.format)?.name ?? tournament.format;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-content-2xl flex-1 flex-col overflow-y-auto px-4 py-3 sm:px-6">
      <MatchLiveHeader
        players={players} modeName={modeName} bestOfLabel="Best of 3"
        status={tournament.status} isPlayer={isPlayer} leaving={leave.leaving}
        peerState={peerState} peerError={peerError} peerTransport={peerTransport}
        peerQuality={peerQuality} localName={local.username} opponentName={remote.username}
        peerReconnecting={peerReconnecting}
        canDeclare={showLiveNotices && !resultClaimPending && !resultReselectionRequired &&
          !reconnectGraceActive && tournament.matchStatus === 'ongoing'}
        declareBusy={declareResult.declaring} onDeclare={declareResult.declare} onLeave={leave.leave}
      />
      {tournament.status === 'in_registrazione' && !ready.tableFull && (
        <p className="mb-4 rounded-2xl border border-amber-400/30 bg-card2-end/95 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-card2-end/25">
          In attesa del secondo giocatore… La partita inizierà quando il tavolo sarà completo.
        </p>
      )}
      {ready.readyPhase && isPlayer && (
        <MatchReadyPanel
          local={local} remote={remote} myReady={ready.myReady} opponentReady={ready.opponentReady}
          pending={ready.pending} startingLife={life.startingLife}
          lifeConnected={chat.connectionState === 'connected' && life.synced}
          canSetStartingLife={isHost} onStartingLifeChange={life.setStartingLife}
          onReady={ready.toggleReady} onDecline={exit.fireExit}
          onOpponentDeclined={exit.markOpponentDeclined}
        />
      )}
      {ready.error && isPlayer && <MatchErrorNotice message={ready.error} />}
      {isObserver && (
        <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65">
          La visione video per gli osservatori non è ancora disponibile.
        </p>
      )}
      {showLiveNotices && isPlayer && started && (
        <MatchConnectionNotice reconnecting={peerReconnecting} onRetry={retryPeer}
          opponentName={remote.username} graceDeadline={tournament.graceDeadline}
          disconnectedIsMe={disconnectedIsMe} />
      )}
      {isPlayer && started && tournament.matchId && (
        <MatchGapProtectionNotice snapshot={gapProtection.snapshot}
          onConsent={gapProtection.grantUploadConsent} onDecline={gapProtection.declineUpload}
          onRetry={gapProtection.retryUpload} />
      )}
      {publicConfig.features.matchGapRecording && isPlayer && tournament.matchId && (
        <MatchGapPeerReview matchId={tournament.matchId} opponentName={remote.username} />
      )}
      {showLiveNotices && visibleError && isPlayer && (
        <MatchErrorNotice message={visibleError} onRetry={visiblePeerError ? retryPeer : undefined} />
      )}
      {showResultPanel && !matchEnded && isPlayer && (
        <MatchResultPendingPanel
          awaitingMe={resultReselectionRequired && !resultClaimPending ? true : !iClaimedResult}
          reselection={resultReselectionRequired} remaining={resultCountdown}
          reconnecting={reconnectGraceActive} busy={declareResult.declaring}
          localName={local.username} opponentName={remote.username} onDeclare={declareResult.declare}
        />
      )}
      {exit.opponentDeclined ? (
        <MatchDeclinedPanel leaving={exit.exitFired} secondsLeft={exit.declinedLeftSeconds}
          onLeave={exit.fireExit} />
      ) : matchEnded ? (
        <MatchEndedPanel opponentLeft={isPlayer && peerState === 'peer-left'}
          didIWin={didIWin} endReason={tournament.endReason} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="mx-auto w-full lg:max-w-[calc((100dvh-340px)*3.5556+0.75rem)]">
            <MatchVideoGrid
              isObserver={isObserver} isPlayer={isPlayer} started={playable}
              leftPlayer={leftPlayer} rightPlayer={rightPlayer} formatName={formatName}
              localStream={localStream} remoteStream={remoteStream} feedLabel={feedLabel}
              peerConnecting={peerConnecting} remoteEmptyLabel={remoteEmptyLabel}
              camOn={camOn} micOn={micOn} lifeByPlayerId={life.lifeByPlayerId}
              startingLife={life.startingLife}
              lifeConnected={chat.connectionState === 'connected' && life.synced}
              stickerShot={sticker.stickerShot} participantNames={participantNames}
              userId={userId} me={me} onToggleMic={() => setMicOn((value) => !value)}
              onToggleCam={() => setCamOn((value) => !value)}
              onFullscreen={() => setFullscreenOpen(true)} onLifeChange={life.changeLife}
              onLifeReset={life.resetLife}
            />
          </div>
          <div className="min-h-[220px] flex-1 lg:min-h-[150px]">
            <MatchCommentsPanel {...chatPanelProps} onSticker={sticker.handleSticker} />
          </div>
        </div>
      )}
      <MatchFullscreenArena
        open={fullscreenOpen && !matchEnded} localStream={localStream} remoteStream={remoteStream}
        localUsername={local.username} remoteUsername={remote.username}
        localPlayerId={local.id} remotePlayerId={remote.id} localFeedLabel={feedLabel}
        connecting={peerConnecting} remoteEmptyLabel={remoteEmptyLabel} camOn={camOn} micOn={micOn}
        startingLife={life.startingLife} lifeByPlayerId={life.lifeByPlayerId}
        lifeConnected={chat.connectionState === 'connected' && life.synced}
        playmatId={defaultPlaymatId} chat={chatPanelProps}
        onToggleCam={() => setCamOn((value) => !value)}
        onToggleMic={() => setMicOn((value) => !value)} onLifeChange={life.changeLife}
        onLifeReset={life.resetLife} onClose={() => setFullscreenOpen(false)}
      />
      <MatchIntroOverlay active={isPlayer && started} matchId={tournament.matchId}
        players={players} remainingSeconds={startCountdown.remainingSeconds} />
    </div>
  );
}
