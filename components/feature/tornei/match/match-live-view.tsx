'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { leaveTournamentAction } from '@/actions/tournaments';
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
import { useMatchGapRecorder } from '@/hooks/use-match-gap-recorder';
import { useServerConnectionQuality } from '@/hooks/use-server-connection-quality';
import type { PlaymatId } from '@/lib/playmats';
import { clearActiveMatch } from '@/lib/active-match-storage';
import { publicConfig } from '@/lib/public-config';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
import { reconnectingLabel } from './match-live-parts';
import {
  MatchConnectionNotice,
  MatchDeclinedPanel,
  MatchEndedPanel,
  MatchErrorNotice,
  MatchResultPendingPanel,
} from './match-live-notices';
import { MatchReadyPanel } from './match-ready-panel';
import { resolveMatchSides } from './match-players';
import { MatchVideoGrid } from './match-video-grid';
import { MatchGapProtectionNotice } from './match-gap-protection-notice';
interface MatchLiveViewProps {
  tournament: Tournament;
  role: LiveViewRole;
  me: string;
  userId: string;
  isHost: boolean;
  defaultPlaymatId: PlaymatId;
}

export function MatchLiveView({ tournament, role, me, userId, isHost, defaultPlaymatId }: MatchLiveViewProps) {
  const router = useRouter();
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
    quality: peerQuality,
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
  const fallbackQuality = useServerConnectionQuality(
    isPlayer && started && !peerQuality ? peerSessionId : null,
  );
  const visiblePeerQuality = peerQuality ?? fallbackQuality;
  const gapProtection = useMatchGapRecorder({
    enabled: publicConfig.features.matchGapRecording,
    active: isPlayer && started && tournament.matchStatus !== 'finished',
    matchId: tournament.matchId,
    webcamSessionId: peerSessionId,
    userId,
    peerState,
    localStream,
  });
  const peerConnecting =
    isPlayer && started && !remoteStream && peerState !== 'failed' && peerState !== 'idle';

  // La prima dichiarazione è solo una proposta: tavolo, video e chat restano
  // attivi finché l'altro giocatore non indica lo stesso vincitore.
  const resultClaimPending = tournament.resultStatus === 'claimed';
  const resultReselectionRequired = tournament.resultReselectionRequired === true;
  const matchEnded =
    tournament.status === 'terminata' ||
    (!resultClaimPending && tournament.matchStatus === 'finished');
  // Un evento WebRTC locale non è una prova di abbandono e non chiude il
  // match. L'esito è mostrato solo quando arriva dal contratto autorevole.
  const didIWin =
    isPlayer && tournament.winnerUserId ? tournament.winnerUserId === userId : undefined;
  const disconnectedIsMe = isPlayer && tournament.disconnectedUserId === userId;
  const iClaimedResult = resultClaimPending && tournament.resultClaimedBy === userId;
  const showResultPanel = resultClaimPending || resultReselectionRequired;
  const resultCountdown = useGraceCountdown(tournament.resultClaimDeadline);
  const disconnectCountdown = useGraceCountdown(tournament.graceDeadline);
  const [reconnectGraceElapsed, setReconnectGraceElapsed] = useState(false);
  const ready = useMatchReady(tournament, userId);
  const leave = useLeaveMatch(tournament, async () => {
    clearActiveMatch(tournament.id);
    await notifyLeave();
  });
  const declareResult = useDeclareResult(tournament, userId, remote.id);

  // Uscita senza conferma: usata per il rifiuto esplicito (o il timeout
  // dell'accettazione) e per restituire in lobby chi ha visto il tavolo chiuso.
  const exitTable = useCallback(() => {
    (async () => {
      const result = await leaveTournamentAction(tournament.id);
      clearActiveMatch(tournament.id);
      if (result.error) {
        router.refresh();
        return;
      }
      router.replace('/tornei');
      router.refresh();
    })();
  }, [tournament.id, router]);

  // Stati interlocked: una sola uscita, nessun doppio leave nella stessa fase.
  const [opponentDeclined, setOpponentDeclined] = useState(false);
  const [exitFired, setExitFired] = useState(false);
  const exitFiredRef = useRef(false);
  const fireExit = useCallback(() => {
    if (exitFiredRef.current) return;
    exitFiredRef.current = true;
    setExitFired(true);
    void exitTable();
  }, [exitTable]);

  // Rileva la scomparsa EMERGENTE dell'avversario durante l'accettazione
  // (es. si è alzato o ha chiuso il browser prima del timeout): tavolo pieno
  // osservato, poi di nuovo a un solo giocatore. Latch stateful, non
  // derivato: resta visibile anche ai refresh successivi.
  const wasFullRef = useRef(ready.tableFull);
  useEffect(() => {
    const full = wasFullRef.current;
    wasFullRef.current = ready.tableFull;
    if (tournament.status !== 'in_registrazione' || matchEnded || resultClaimPending) return;
    if (full && !ready.tableFull) {
      setOpponentDeclined(true);
    }
  }, [ready.tableFull, tournament.status, matchEnded, resultClaimPending]);

  // Pannello "non ha accettato": qualche secondo, poi si torna in lobby da soli.
  const [declinedLeftSeconds, setDeclinedLeftSeconds] = useState(5);
  useEffect(() => {
    if (!opponentDeclined) return;
    setDeclinedLeftSeconds(5);
    const interval = setInterval(() => {
      setDeclinedLeftSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(interval);
          fireExit();
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [opponentDeclined, fireExit]);
  const { stickerShot, handleSticker } = useMatchStickerShot();
  const chat = useMatchChat({
    matchId: tournament.matchId,
    userId,
    active: isPlayer && !!tournament.matchId && tournament.status !== 'terminata',
  });
  useEffect(() => {
    if (chat.opponentPresence !== 'unknown') router.refresh();
  }, [chat.opponentPresence, router]);
  const hasReconnectDeadline = Boolean(tournament.graceDeadline);
  useEffect(() => {
    if (hasReconnectDeadline && disconnectCountdown !== null) {
      setReconnectGraceElapsed(disconnectCountdown <= 0);
    } else if (!peerReconnecting && chat.opponentPresence === 'online') {
      setReconnectGraceElapsed(false);
    }
  }, [
    chat.opponentPresence,
    disconnectCountdown,
    hasReconnectDeadline,
    peerReconnecting,
  ]);
  const reconnectGraceActive = hasReconnectDeadline
    ? disconnectCountdown === null || disconnectCountdown > 0
    : !reconnectGraceElapsed &&
      (peerReconnecting || chat.opponentPresence === 'offline');
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
    graceCountdownActive:
      Boolean(tournament.graceDeadline) ||
      Boolean(tournament.resultClaimDeadline) ||
      resultReselectionRequired,
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
  // Il video dell'avversario era già arrivato ed è caduto: non è una prima
  // connessione ma una riconnessione, e va detto con il suo nome — sia nel
  // riquadro vuoto sia nell'avviso in cima.
  const remoteEmptyLabel = peerReconnecting
    ? reconnectingLabel(remote.username, disconnectedIsMe)
    : undefined;
  const visiblePeerError = peerReconnecting || peerState === 'peer-left' ? null : peerError;
  const visibleError = leave.error ?? webcamError ?? visiblePeerError ?? declareResult.error;
  const showLiveNotices = !matchEnded;

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
        peerQuality={visiblePeerQuality}
        localName={local.username}
        opponentName={remote.username}
        peerReconnecting={peerReconnecting}
        canDeclare={
          showLiveNotices &&
          !resultClaimPending &&
          !resultReselectionRequired &&
          !reconnectGraceActive &&
          tournament.matchStatus === 'ongoing'
        }
        declareBusy={declareResult.declaring}
        onDeclare={declareResult.declare}
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
          onDecline={fireExit}
          onOpponentDeclined={() => setOpponentDeclined(true)}
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
          opponentName={remote.username}
          graceDeadline={tournament.graceDeadline}
          disconnectedIsMe={disconnectedIsMe}
        />
      )}
      {showLiveNotices && isPlayer && started && (
        <MatchGapProtectionNotice snapshot={gapProtection} />
      )}
      {showLiveNotices && visibleError && isPlayer && (
        <MatchErrorNotice message={visibleError} onRetry={visiblePeerError ? retryPeer : undefined} />
      )}
      {showResultPanel && !matchEnded && isPlayer && (
        <MatchResultPendingPanel
          awaitingMe={resultReselectionRequired && !resultClaimPending ? true : !iClaimedResult}
          reselection={resultReselectionRequired}
          remaining={resultCountdown}
          reconnecting={reconnectGraceActive}
          busy={declareResult.declaring}
          localName={local.username}
          opponentName={remote.username}
          onDeclare={declareResult.declare}
        />
      )}

      {opponentDeclined ? (
        <MatchDeclinedPanel
          leaving={exitFired}
          secondsLeft={declinedLeftSeconds}
          onLeave={fireExit}
        />
      ) : matchEnded ? (
        <MatchEndedPanel
          opponentLeft={isPlayer && peerState === 'peer-left'}
          didIWin={didIWin}
          endReason={tournament.endReason}
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
            remoteEmptyLabel={remoteEmptyLabel}
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
        open={fullscreenOpen && !matchEnded}
        localStream={localStream}
        remoteStream={remoteStream}
        localUsername={local.username}
        remoteUsername={remote.username}
        localPlayerId={local.id}
        remotePlayerId={remote.id}
        localFeedLabel={feedLabel}
        connecting={peerConnecting}
        remoteEmptyLabel={remoteEmptyLabel}
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
