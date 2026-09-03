import type { Dispatch, SetStateAction } from 'react';
import type { useDeclareResult } from '@/hooks/use-declare-result';
import { useGraceCountdown } from '@/hooks/use-grace-countdown';
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
import { useMatchJudge } from '@/hooks/use-match-judge';
import { useMatchJudgeActivity } from '@/hooks/use-match-judge-activity';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchJudge } from './match-judge';
import { MatchEndFeedback } from './match-end-feedback';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchGapPeerReview } from './match-gap-peer-review';
import { MatchGapProtectionNotice } from './match-gap-protection-notice';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
import { MatchDeclinedPanel, MatchEndedPanel, MatchErrorNotice } from './match-live-notices';
import { reconnectingLabel } from './match-live-parts';
import { MatchReadyPanel } from './match-ready-panel';
import { MatchResultPendingPanel } from './match-result-pending';
import { MatchVideoGrid } from './match-video-grid';
import { OpponentDeckReveal } from './opponent-deck-reveal';

interface MatchLiveContentProps {
  tournament: Tournament; me: string; userId: string; isHost: boolean;
  qualifyingMatches: number;
  defaultPlaymatId: PlaymatId; isObserver: boolean; isPlayer: boolean; started: boolean;
  matchEnded: boolean; resultClaimPending: boolean; resultReselectionRequired: boolean;
  showResultPanel: boolean; iClaimedResult: boolean; resultCountdown: number | null;
  reconnectGraceActive: boolean; disconnectedIsMe: boolean; didIWin: boolean | undefined;
  local: Participant; remote: Participant; players: [Participant, Participant];
  leftPlayer: Participant; rightPlayer: Participant; playable: boolean;
  localStream: MediaStream | null; remoteStream: MediaStream | null; feedLabel?: string;
  webcamError: string | null; camOn: boolean; micOn: boolean; opponentMuted: boolean;
  mirroredLocal?: boolean; mirroredRemote?: boolean;
  fullscreenOpen: boolean; setCamOn: Dispatch<SetStateAction<boolean>>;
  setMicOn: Dispatch<SetStateAction<boolean>>; setOpponentMuted: Dispatch<SetStateAction<boolean>>;
  setMirroredLocal?: Dispatch<SetStateAction<boolean>>; setMirroredRemote?: Dispatch<SetStateAction<boolean>>;
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
    tournament, me, userId, isHost, qualifyingMatches, defaultPlaymatId, isObserver, isPlayer, started,
    matchEnded, resultClaimPending, resultReselectionRequired, showResultPanel,
    iClaimedResult, resultCountdown, reconnectGraceActive, disconnectedIsMe, didIWin,
    local, remote, players, leftPlayer, rightPlayer, playable, localStream, remoteStream,
    feedLabel, webcamError, camOn, micOn, opponentMuted, mirroredLocal, mirroredRemote,
    fullscreenOpen, setCamOn, setMicOn, setOpponentMuted, setMirroredLocal, setMirroredRemote,
    setFullscreenOpen, peerState, peerError, peerTransport, peerQuality,
    peerReconnecting, peerConnecting, retryPeer, ready, leave, declareResult, exit, chat,
    life, startCountdown, sticker, gapProtection,
  } = props;
  const judgeController = useMatchJudge(tournament.matchId, tournament.judge?.status);
  const judgeActivity = useMatchJudgeActivity({
    userId, opponentId: remote.id, opponentName: remote.username,
    messages: chat.messages, send: chat.send,
    draft: judgeController.draft, pending: judgeController.pending,
    judgeStatus: tournament.judge?.status,
  });
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
  const graceRemaining = useGraceCountdown(tournament.graceDeadline);
  const modeName = getMode(tournament.mode)?.name ?? tournament.mode;
  const formatName = getFormat(tournament.format)?.name ?? tournament.format;
  const winnerId = tournament.winnerUserId;
  const loserId = winnerId ? players.find((player) => player.id !== winnerId)?.id : undefined;
  const winnerScore = winnerId ? tournament.scoreByPlayerId?.[winnerId] : undefined;
  const loserScore = loserId ? tournament.scoreByPlayerId?.[loserId] : undefined;
  const resultScore = winnerScore !== undefined && loserScore !== undefined ? `${winnerScore} – ${loserScore}` : undefined;
  const fullscreenActive = fullscreenOpen && !matchEnded;
  const judgePanel = isPlayer && tournament.matchId ? (
    <MatchJudge
      matchId={tournament.matchId} userId={userId} participantNames={participantNames}
      judge={tournament.judge} matchEnded={matchEnded} controller={judgeController}
      fullscreen={fullscreenActive} opponentActivity={judgeActivity}
    />
  ) : null;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-content-2xl flex-1 flex-col overflow-y-auto px-4 py-3 sm:px-6">
      <MatchLiveHeader
        players={players} modeName={modeName}
        bestOfLabel={`Best of ${tournament.bestOf.slice(2)}`} bestOf={tournament.bestOf}
        status={tournament.status} isPlayer={isPlayer} leaving={leave.leaving}
        peerState={peerState} peerError={peerError} peerTransport={peerTransport}
        peerQuality={peerQuality} localName={local.username} opponentName={remote.username}
        qualifyingMatches={qualifyingMatches}
        peerReconnecting={peerReconnecting}
        canDeclare={showLiveNotices && !resultClaimPending && !resultReselectionRequired &&
          !reconnectGraceActive && tournament.matchStatus === 'ongoing'}
        declareBusy={declareResult.declaring} onDeclare={declareResult.declare} onLeave={leave.leave}
        reportMatchId={tournament.matchId}
      />
      {tournament.status === 'in_registrazione' && !ready.tableFull && (
        <p className="mb-4 rounded-2xl border border-amber-400/30 bg-header-bg/95 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-black/30">
          In attesa del secondo giocatore… La partita inizierà quando il tavolo sarà completo.
        </p>
      )}
      {ready.readyPhase && isPlayer && (
        <MatchReadyPanel
          local={local} remote={remote} myReady={ready.myReady} opponentReady={ready.opponentReady}
          acceptanceOpensAt={tournament.acceptanceOpensAt}
          readyDeadline={tournament.readyDeadline} serverTime={tournament.serverTime}
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
          localName={local.username} opponentName={remote.username}
          localId={local.id} opponentId={remote.id} bestOf={tournament.bestOf}
          claimedWinnerId={tournament.resultClaimedWinner}
          scoreByPlayerId={tournament.scoreByPlayerId} error={declareResult.error}
          qualifyingMatches={qualifyingMatches}
          onDeclare={declareResult.declare}
        />
      )}
      {exit.opponentDeclined ? (
        <MatchDeclinedPanel leaving={exit.exitFired} secondsLeft={exit.declinedLeftSeconds}
          onLeave={exit.fireExit} />
      ) : matchEnded ? (
        <>
          <MatchEndedPanel
            opponentLeft={isPlayer && peerState === 'peer-left'}
            didIWin={didIWin}
            endReason={tournament.endReason}
            resultScore={resultScore}
          >
            {isPlayer && (
              <>
                <OpponentDeckReveal opponent={remote} formatName={formatName} />
                <MatchEndFeedback
                  matchId={tournament.matchId ?? null}
                  endReason={tournament.endReason}
                  didIWin={didIWin}
                  opponentName={remote.username}
                />
              </>
            )}
          </MatchEndedPanel>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="mx-auto w-full lg:max-w-[calc((100dvh-340px)*3.5556+0.75rem)]">
            <MatchVideoGrid
              isObserver={isObserver} isPlayer={isPlayer} started={playable}
              leftPlayer={leftPlayer} rightPlayer={rightPlayer} formatName={formatName}
              localStream={localStream} remoteStream={remoteStream} feedLabel={feedLabel}
              peerConnecting={peerConnecting} peerReconnecting={peerReconnecting}
              graceRemaining={graceRemaining} disconnectedIsMe={disconnectedIsMe}
              remoteEmptyLabel={remoteEmptyLabel}
              camOn={camOn} micOn={micOn} opponentMuted={opponentMuted}
              mirroredLocal={mirroredLocal} mirroredRemote={mirroredRemote}
              lifeByPlayerId={life.lifeByPlayerId} startingLife={life.startingLife}
              lifeConnected={chat.connectionState === 'connected' && life.synced}
              stickerShot={sticker.stickerShot} participantNames={participantNames}
              userId={userId} me={me} onToggleMic={() => setMicOn((value) => !value)}
              onToggleCam={() => setCamOn((value) => !value)}
              onToggleOpponentMute={() => setOpponentMuted((v) => !v)}
              onToggleMirrorLocal={setMirroredLocal ? () => setMirroredLocal((v) => !v) : undefined}
              onToggleMirrorRemote={setMirroredRemote ? () => setMirroredRemote((v) => !v) : undefined}
              onFullscreen={() => setFullscreenOpen(true)} onLifeChange={life.changeLife}
              onLifeReset={life.resetLife} onRetryPeer={retryPeer}
            />
          </div>
          <div className="min-h-[220px] flex-1 lg:min-h-[150px]">
            <MatchCommentsPanel {...chatPanelProps} onSticker={sticker.handleSticker} />
          </div>
        </div>
      )}
      {!fullscreenActive && judgePanel}
      <MatchFullscreenArena
        open={fullscreenOpen && !matchEnded} localStream={localStream} remoteStream={remoteStream}
        localUsername={local.username} remoteUsername={remote.username}
        localPlayerId={local.id} remotePlayerId={remote.id} localFeedLabel={feedLabel}
        connecting={peerConnecting} peerReconnecting={peerReconnecting}
        graceRemaining={graceRemaining}
        remoteEmptyLabel={remoteEmptyLabel} camOn={camOn} micOn={micOn}
        opponentMuted={opponentMuted} mirroredLocal={mirroredLocal} mirroredRemote={mirroredRemote}
        startingLife={life.startingLife} lifeByPlayerId={life.lifeByPlayerId}
        lifeConnected={chat.connectionState === 'connected' && life.synced}
        playmatId={defaultPlaymatId} chat={chatPanelProps}
        judge={fullscreenActive ? judgePanel : null}
        onToggleCam={() => setCamOn((value) => !value)}
        onToggleMic={() => setMicOn((value) => !value)}
        onToggleOpponentMute={() => setOpponentMuted((v) => !v)}
        onToggleMirrorLocal={setMirroredLocal ? () => setMirroredLocal((v) => !v) : undefined}
        onToggleMirrorRemote={setMirroredRemote ? () => setMirroredRemote((v) => !v) : undefined}
        onLifeChange={life.changeLife}
        onLifeReset={life.resetLife} onRetryPeer={retryPeer}
        onClose={() => setFullscreenOpen(false)}
      />
      <MatchIntroOverlay active={isPlayer && started} matchId={tournament.matchId}
        players={players} remainingSeconds={startCountdown.remainingSeconds}
        startsAtLocalMs={startCountdown.startsAtLocalMs} />
    </div>
  );
}
