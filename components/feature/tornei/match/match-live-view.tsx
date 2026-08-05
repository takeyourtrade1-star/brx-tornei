'use client';
import type { Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
import { getFormat, getMode } from '@/lib/data/catalog';
import { useDeclareResult } from '@/hooks/use-declare-result';
import { useGraceCountdown } from '@/hooks/use-grace-countdown';
import { useLeaveMatch } from '@/hooks/use-leave-match';
import { useMatchPeerConnection } from '@/hooks/use-match-peer-connection';
import { useMatchReady } from '@/hooks/use-match-ready';
import { useMatchChat } from '@/hooks/use-match-chat';
import { useMatchLife } from '@/hooks/use-match-life';
import { useMatchStartCountdown } from '@/hooks/use-match-start-countdown';
import { useMatchStickerShot } from '@/hooks/use-match-sticker-shot';
import { useMatchTournamentRefresh } from '@/hooks/use-match-tournament-refresh';
import { useMatchMediaState } from '@/hooks/use-match-media-state';
import { useActiveMatchReference } from '@/hooks/use-active-match-reference';
import { usePlayerWebcam } from '@/hooks/use-player-webcam';
import type { PlaymatId } from '@/lib/playmats';
import { clearActiveMatch } from '@/lib/active-match-storage';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
import {
  MatchConnectionNotice,
  MatchDeclareResultBar,
  MatchEndedPanel,
  MatchErrorNotice,
  MatchResultPendingPanel,
} from './match-live-notices';
import { MatchReadyPanel } from './match-ready-panel';
import { resolveMatchSides } from './match-players';
import { MatchVideoGrid } from './match-video-grid';
interface MatchLiveViewProps {
  tournament: Tournament;
  role: LiveViewRole;
  me: string;
  userId: string;
  isHost: boolean;
  defaultPlaymatId: PlaymatId;
}

export function MatchLiveView({ tournament, role, me, userId, isHost, defaultPlaymatId }: MatchLiveViewProps) {
  const isObserver = role === 'observer';
  const isPlayer = !isObserver;
  const { local, remote, players } = resolveMatchSides(tournament, me, userId);
  const [playerA, playerB] = players;
  const leftPlayer = isObserver ? playerA : local;
  const rightPlayer = isObserver ? playerB : remote;
  const modeName = getMode(tournament.mode)?.name ?? tournament.mode;
  const formatName = getFormat(tournament.format)?.name ?? tournament.format;
  const started = tournament.status === 'iniziata';
  const authorityPlayerId = isHost ? local.id : remote.id;
  const { stream: localStream, feedLabel, error: webcamError } = usePlayerWebcam(
    isPlayer && tournament.status !== 'terminata',
  );
  const { camOn, setCamOn, micOn, setMicOn, fullscreenOpen, setFullscreenOpen } =
    useMatchMediaState(localStream);
  const peerSessionId = tournament.matchWebcamSessionId ?? tournament.matchId ?? null;
  const {
    state: peerState,
    remoteStream,
    error: peerError,
    transport: peerTransport,
    reconnecting: peerReconnecting,
    retry: retryPeer,
    notifyLeave,
  } = useMatchPeerConnection({
    sessionId: peerSessionId,
    role: isHost ? 'host' : 'guest',
    active: isPlayer && started && !!peerSessionId,
    localStream,
    allowDirect: tournament.withFriend === true,
  });
  const peerConnecting =
    isPlayer && started && !remoteStream && peerState !== 'failed' && peerState !== 'idle';

  // Requisito 2: il match è già 'finished' lato backend (close_match già
  // eseguito alla prima dichiarazione) ma il torneo resta 'active' per tutta
  // la finestra di reclamo — non è ancora l'esito finale, quindi non deve
  // far scattare né il session-ended del signaling né matchEnded.
  const resultClaimPending = tournament.matchStatus === 'finished' && tournament.resultStatus === 'claimed';
  const matchEnded =
    tournament.status === 'terminata' ||
    (!resultClaimPending && isPlayer && (peerState === 'peer-left' || peerState === 'session-ended'));
  // Esito autorevole (Requisiti 3+4): undefined finché il backend non l'ha
  // ancora risolto, o per gli osservatori (per cui non ha senso).
  const didIWin =
    isPlayer && tournament.winnerUserId ? tournament.winnerUserId === userId : undefined;
  const disconnectedIsMe = isPlayer && tournament.disconnectedUserId === userId;
  const iClaimedResult = resultClaimPending && tournament.resultClaimedBy === userId;
  const resultCountdown = useGraceCountdown(tournament.resultClaimDeadline);
  const ready = useMatchReady(tournament, userId);
  const leave = useLeaveMatch(tournament, async () => {
    clearActiveMatch(tournament.id);
    await notifyLeave();
  });
  const declareResult = useDeclareResult(tournament, userId, remote.id);
  const { stickerShot, handleSticker } = useMatchStickerShot();
  const chat = useMatchChat({
    matchId: tournament.matchId,
    userId,
    active: isPlayer && !!tournament.matchId && tournament.status !== 'terminata',
  });
  const life = useMatchLife({
    matchId: tournament.matchId,
    players,
    userId,
    authorityPlayerId,
    messages: chat.messages,
    connected: chat.connectionState === 'connected',
    send: chat.send,
  });
  const startCountdown = useMatchStartCountdown({
    active: isPlayer && started,
    matchId: tournament.matchId,
    userId,
    authorityPlayerId,
    connected: chat.connectionState === 'connected',
    messages: chat.messages,
    send: chat.send,
  });
  const playable = started && (!isPlayer || startCountdown.readyToPlay);

  useMatchTournamentRefresh({
    status: tournament.status,
    tableFull: ready.tableFull,
    // Anche 'session-ended' (il backend ha già chiuso il match) deve
    // aggiornare subito, non solo il bye esplicito dell'avversario.
    peerLeft: peerState === 'peer-left' || peerState === 'session-ended',
    graceCountdownActive: Boolean(tournament.graceDeadline) || Boolean(tournament.resultClaimDeadline),
  });

  useActiveMatchReference({
    isPlayer,
    matchEnded,
    started,
    tournamentId: tournament.id,
    opponent: remote.username,
  });
  const participantNames = Object.fromEntries(
    tournament.participants.map((participant) => [participant.id, participant.username]),
  );
  const chatPanelProps = {
    me,
    userId,
    messages: chat.messages,
    send: chat.send,
    connectionState: chat.connectionState,
    error: chat.error,
    onRetry: chat.retry,
    participantNames,
  };
  const visiblePeerError = peerReconnecting || peerState === 'peer-left' ? null : peerError;
  const visibleError = leave.error ?? webcamError ?? visiblePeerError ?? declareResult.error;
  const showLiveNotices = !matchEnded && !resultClaimPending;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-content-2xl flex-1 flex-col overflow-y-auto px-4 py-3 sm:px-6">
      <MatchLiveHeader
        players={players}
        modeName={modeName}
        bestOfLabel="Best of 3"
        status={tournament.status}
        isPlayer={isPlayer}
        leaving={leave.leaving}
        peerState={peerState}
        peerError={peerError}
        peerTransport={peerTransport}
        onLeave={leave.leave}
      />

      {tournament.status === 'in_registrazione' && !ready.tableFull && (
        <p className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          In attesa del secondo giocatore… La partita inizierà quando il tavolo sarà completo.
        </p>
      )}
      {ready.readyPhase && isPlayer && (
        <MatchReadyPanel
          local={local}
          remote={remote}
          myReady={ready.myReady}
          opponentReady={ready.opponentReady}
          pending={ready.pending}
          startingLife={life.startingLife}
          lifeConnected={chat.connectionState === 'connected' && life.synced}
          canSetStartingLife={isHost}
          onStartingLifeChange={life.setStartingLife}
          onReady={ready.toggleReady}
        />
      )}
      {ready.error && isPlayer && <MatchErrorNotice message={ready.error} />}
      {isObserver && (
        <p className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/65">
          La visione video per gli osservatori non è ancora disponibile.
        </p>
      )}
      {showLiveNotices && isPlayer && started && (
        <MatchConnectionNotice
          reconnecting={peerReconnecting}
          onRetry={retryPeer}
          graceDeadline={tournament.graceDeadline}
          disconnectedIsMe={disconnectedIsMe}
        />
      )}
      {showLiveNotices && isPlayer && tournament.matchStatus === 'ongoing' && (
        <MatchDeclareResultBar busy={declareResult.declaring} onDeclare={declareResult.declare} />
      )}
      {showLiveNotices && visibleError && isPlayer && (
        <MatchErrorNotice message={visibleError} onRetry={visiblePeerError ? retryPeer : undefined} />
      )}

      {matchEnded ? (
        <MatchEndedPanel
          opponentLeft={isPlayer && peerState === 'peer-left'}
          didIWin={didIWin}
          endReason={tournament.endReason}
        />
      ) : resultClaimPending ? (
        <MatchResultPendingPanel
          awaitingMe={!iClaimedResult}
          remaining={resultCountdown}
          busy={declareResult.declaring}
          onDeclare={declareResult.declare}
        />
      ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="mx-auto w-full lg:max-w-[calc((100dvh-340px)*3.5556+0.75rem)]">
          <MatchVideoGrid
            isObserver={isObserver}
            isPlayer={isPlayer}
            started={playable}
            leftPlayer={leftPlayer}
            rightPlayer={rightPlayer}
            formatName={formatName}
            localStream={localStream}
            remoteStream={remoteStream}
            feedLabel={feedLabel}
            peerConnecting={peerConnecting}
            camOn={camOn}
            micOn={micOn}
            lifeByPlayerId={life.lifeByPlayerId}
            startingLife={life.startingLife}
            lifeConnected={chat.connectionState === 'connected' && life.synced}
            stickerShot={stickerShot}
            participantNames={participantNames}
            userId={userId}
            me={me}
            onToggleMic={() => setMicOn((value) => !value)}
            onToggleCam={() => setCamOn((value) => !value)}
            onFullscreen={() => setFullscreenOpen(true)}
            onLifeChange={life.changeLife}
            onLifeReset={life.resetLife}
          />
        </div>
        <div className="min-h-[220px] flex-1 lg:min-h-[150px]">
          <MatchCommentsPanel {...chatPanelProps} onSticker={handleSticker} />
        </div>
      </div>
      )}

      <MatchFullscreenArena
        open={fullscreenOpen && !matchEnded && !resultClaimPending}
        localStream={localStream}
        remoteStream={remoteStream}
        localUsername={local.username}
        remoteUsername={remote.username}
        localPlayerId={local.id}
        remotePlayerId={remote.id}
        localFeedLabel={feedLabel}
        connecting={peerConnecting}
        camOn={camOn}
        micOn={micOn}
        startingLife={life.startingLife}
        lifeByPlayerId={life.lifeByPlayerId}
        lifeConnected={chat.connectionState === 'connected' && life.synced}
        playmatId={defaultPlaymatId}
        chat={chatPanelProps}
        onToggleCam={() => setCamOn((value) => !value)}
        onToggleMic={() => setMicOn((value) => !value)}
        onLifeChange={life.changeLife}
        onLifeReset={life.resetLife}
        onClose={() => setFullscreenOpen(false)}
      />
      <MatchIntroOverlay
        active={isPlayer && started}
        matchId={tournament.matchId}
        players={players}
        remainingSeconds={startCountdown.remainingSeconds}
      />
    </div>
  );
}
