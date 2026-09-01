'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
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
import { useMatchExitFlow } from '@/hooks/use-match-exit-flow';
import { useServerConnectionQuality } from '@/hooks/use-server-connection-quality';
import { useTournamentRealtimeRefresh } from '@/hooks/use-tournament-realtime-refresh';
import type { PlaymatId } from '@/lib/playmats';
import { mergeTournamentWithHint } from '@/lib/tournament-coordination';
import { clearActiveMatch } from '@/lib/active-match-storage';
import { publicConfig } from '@/lib/public-config';
import { resolveMatchSides } from './match-players';
import { MatchLiveContent } from './match-live-content';
interface MatchLiveViewProps {
  tournament: Tournament;
  role: LiveViewRole;
  me: string;
  userId: string;
  isHost: boolean;
  defaultPlaymatId: PlaymatId;
}

export function MatchLiveView({
  tournament: tournamentSnapshot,
  role,
  me,
  userId,
  isHost,
  defaultPlaymatId,
}: MatchLiveViewProps) {
  const router = useRouter();
  const isObserver = role === 'observer';
  const isPlayer = !isObserver;
  const realtimeHint = useTournamentRealtimeRefresh({
    tournamentId: tournamentSnapshot.id,
    active: isPlayer && tournamentSnapshot.status !== 'terminata',
  });
  // L'evento realtime può anticipare il refresh RSC: per la fase e l'avvio
  // uso subito l'hint, mantenendo nel frattempo il resto dello snapshot.
  const tournament = useMemo(
    () => mergeTournamentWithHint(tournamentSnapshot, realtimeHint),
    [realtimeHint, tournamentSnapshot],
  );
  const { local, remote, players } = resolveMatchSides(tournament, me, userId);
  const [playerA, playerB] = players;
  const leftPlayer = isObserver ? playerA : local;
  const rightPlayer = isObserver ? playerB : remote;
  const started = tournament.status === 'iniziata';
  const authorityPlayerId = isHost ? local.id : remote.id;
  const { stream: localStream, feedLabel, error: webcamError } = usePlayerWebcam(
    isPlayer && tournament.status !== 'terminata',
  );
  const {
    camOn,
    setCamOn,
    micOn,
    setMicOn,
    opponentMuted,
    setOpponentMuted,
    mirroredLocal,
    setMirroredLocal,
    mirroredRemote,
    setMirroredRemote,
    fullscreenOpen,
    setFullscreenOpen,
  } = useMatchMediaState(localStream);
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

  const exit = useMatchExitFlow({
    tournamentId: tournament.id,
    tournamentStatus: tournament.status,
    tableFull: ready.tableFull,
    matchEnded,
    resultClaimPending,
  });
  const sticker = useMatchStickerShot();
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
    authoritativeStartsAt: tournament.startsAt,
    serverTime: tournament.serverTime,
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
  return (
    <MatchLiveContent
      tournament={tournament} me={me} userId={userId} isHost={isHost}
      defaultPlaymatId={defaultPlaymatId} isObserver={isObserver} isPlayer={isPlayer}
      started={started} matchEnded={matchEnded} resultClaimPending={resultClaimPending}
      resultReselectionRequired={resultReselectionRequired} showResultPanel={showResultPanel}
      iClaimedResult={iClaimedResult} resultCountdown={resultCountdown}
      reconnectGraceActive={reconnectGraceActive} disconnectedIsMe={disconnectedIsMe}
      didIWin={didIWin} local={local} remote={remote} players={players}
      leftPlayer={leftPlayer} rightPlayer={rightPlayer} playable={playable}
      localStream={localStream} remoteStream={remoteStream} feedLabel={feedLabel}
      webcamError={webcamError} camOn={camOn} micOn={micOn} opponentMuted={opponentMuted}
      mirroredLocal={mirroredLocal} mirroredRemote={mirroredRemote}
      fullscreenOpen={fullscreenOpen} setCamOn={setCamOn} setMicOn={setMicOn}
      setOpponentMuted={setOpponentMuted} setMirroredLocal={setMirroredLocal}
      setMirroredRemote={setMirroredRemote} setFullscreenOpen={setFullscreenOpen}
      peerState={peerState} peerError={peerError} peerTransport={peerTransport}
      peerQuality={visiblePeerQuality} peerReconnecting={peerReconnecting}
      peerConnecting={peerConnecting} retryPeer={retryPeer} ready={ready} leave={leave}
      declareResult={declareResult} exit={exit} chat={chat} life={life}
      startCountdown={startCountdown} sticker={sticker} gapProtection={gapProtection}
    />
  );
}
