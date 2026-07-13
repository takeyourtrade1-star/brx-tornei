'use client';

import { useEffect, useState } from 'react';
import type { Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
import { getFormat, getMode } from '@/lib/data/catalog';
import { useLeaveMatch } from '@/hooks/use-leave-match';
import { useMatchPeerConnection } from '@/hooks/use-match-peer-connection';
import { useMatchReady } from '@/hooks/use-match-ready';
import { useMatchChat } from '@/hooks/use-match-chat';
import { useMatchLife } from '@/hooks/use-match-life';
import { useMatchStartCountdown } from '@/hooks/use-match-start-countdown';
import { useMatchStickerShot } from '@/hooks/use-match-sticker-shot';
import { useMatchTournamentRefresh } from '@/hooks/use-match-tournament-refresh';
import { usePlayerWebcam } from '@/hooks/use-player-webcam';
import type { PlaymatId } from '@/lib/playmats';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
import { MatchConnectionNotice, MatchEndedNotice, MatchErrorNotice } from './match-live-notices';
import { MatchReadyPanel } from './match-ready-panel';
import { resolveMatchSides } from './match-players';
import { MatchVideoGrid } from './match-video-grid';

interface MatchLiveViewProps {
  tournament: Tournament;
  role: LiveViewRole;
  me: string;
  userId: string;
  accessToken: string;
  isHost: boolean;
  defaultPlaymatId: PlaymatId;
}

export function MatchLiveView({
  tournament,
  role,
  me,
  userId,
  accessToken,
  isHost,
  defaultPlaymatId,
}: MatchLiveViewProps) {
  const isObserver = role === 'observer';
  const isPlayer = !isObserver;
  const { local, remote, players } = resolveMatchSides(tournament, me, userId);
  const [playerA, playerB] = players;
  const leftPlayer = isObserver ? playerA : local;
  const rightPlayer = isObserver ? playerB : remote;
  const modeName = getMode(tournament.mode)?.name ?? tournament.mode;
  const formatName = getFormat(tournament.format)?.name ?? tournament.format;
  const bestOfLabel = 'Best of 3';
  const started = tournament.status === 'iniziata';
  const authorityPlayerId = isHost ? local.id : remote.id;

  const { stream: localStream, feedLabel, error: webcamError } = usePlayerWebcam(isPlayer);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  useEffect(() => {
    if (!localStream) return;
    for (const track of localStream.getVideoTracks()) track.enabled = camOn;
    for (const track of localStream.getAudioTracks()) track.enabled = micOn;
  }, [localStream, camOn, micOn]);

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

  const ready = useMatchReady(tournament, userId);
  const leave = useLeaveMatch(tournament, notifyLeave);
  const { stickerShot, handleSticker } = useMatchStickerShot();
  const chat = useMatchChat({
    matchId: tournament.matchId,
    accessToken,
    userId,
    active: isPlayer && !!tournament.matchId,
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
    peerLeft: peerState === 'peer-left',
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
    participantNames,
  };
  const visiblePeerError = peerReconnecting || peerState === 'peer-left' ? null : peerError;
  const visibleError = leave.error ?? webcamError ?? visiblePeerError;

  return (
    <div className="mx-auto flex w-full max-w-content-2xl flex-col px-4 py-4 pb-12 sm:px-6">
      <MatchLiveHeader
        players={players}
        modeName={modeName}
        bestOfLabel={bestOfLabel}
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
          lifeConnected={chat.connectionState === 'connected'}
          canSetStartingLife={isHost}
          onStartingLifeChange={life.setStartingLife}
          onReady={ready.toggleReady}
        />
      )}
      {ready.error && isPlayer && <MatchErrorNotice message={ready.error} />}
      {tournament.status === 'terminata' && <MatchEndedNotice />}
      {isPlayer && started && (
        <MatchConnectionNotice
          state={peerState}
          reconnecting={peerReconnecting}
          onRetry={retryPeer}
        />
      )}
      {visibleError && isPlayer && (
        <MatchErrorNotice message={visibleError} onRetry={visiblePeerError ? retryPeer : undefined} />
      )}

      <div className="flex min-h-0 flex-col gap-3">
        <MatchVideoGrid
          isObserver={isObserver}
          isPlayer={isPlayer}
          started={playable}
          playerA={playerA}
          local={local}
          remote={remote}
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
          lifeConnected={chat.connectionState === 'connected'}
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
        <div className="h-[180px] min-h-0">
          <MatchCommentsPanel {...chatPanelProps} onSticker={handleSticker} />
        </div>
      </div>

      <MatchFullscreenArena
        open={fullscreenOpen}
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
        lifeConnected={chat.connectionState === 'connected'}
        playmatId={defaultPlaymatId}
        chat={chatPanelProps}
        onToggleCam={() => setCamOn((value) => !value)}
        onToggleMic={() => setMicOn((value) => !value)}
        onLifeChange={life.changeLife}
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
