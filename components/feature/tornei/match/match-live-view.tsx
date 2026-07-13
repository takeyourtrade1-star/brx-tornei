'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Tournament } from '@/types/tournament';
import type { LiveViewRole } from '@/lib/validations/live';
import { getFormat, getMode } from '@/lib/data/catalog';
import { useLeaveMatch } from '@/hooks/use-leave-match';
import { useMatchPeerConnection } from '@/hooks/use-match-peer-connection';
import { useMatchReady } from '@/hooks/use-match-ready';
import { useMatchStickerShot } from '@/hooks/use-match-sticker-shot';
import { usePlayerWebcam } from '@/hooks/use-player-webcam';
import { MatchCommentsPanel } from './match-comments-panel';
import { MatchFullscreenArena } from './match-fullscreen-arena';
import { MatchInfoBar } from './match-live-parts';
import { MatchIntroOverlay } from './match-intro-overlay';
import { MatchLiveHeader } from './match-live-header';
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
}

export function MatchLiveView({
  tournament,
  role,
  me,
  userId,
  accessToken,
  isHost,
}: MatchLiveViewProps) {
  const router = useRouter();
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
    retry: retryPeer,
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
  const leave = useLeaveMatch(tournament);
  const { stickerShot, handleSticker } = useMatchStickerShot();

  useEffect(() => {
    if (tournament.status === 'terminata') return;
    const intervalMs =
      tournament.status === 'in_registrazione' ? (ready.tableFull ? 3_000 : 5_000) : 12_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [tournament.status, ready.tableFull, router]);

  const participantNames = Object.fromEntries(
    tournament.participants.map((participant) => [participant.id, participant.username]),
  );
  const visibleError = leave.error ?? webcamError ?? peerError;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-content flex-col px-4 py-4 pb-16 sm:px-6">
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
          onReady={ready.toggleReady}
        />
      )}
      {ready.error && isPlayer && <ErrorNotice message={ready.error} />}
      {tournament.status === 'terminata' && <MatchEndedNotice />}
      {visibleError && isPlayer && (
        <ErrorNotice message={visibleError} onRetry={peerError ? retryPeer : undefined} />
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MatchVideoGrid
          isObserver={isObserver}
          isPlayer={isPlayer}
          started={started}
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
          stickerShot={stickerShot}
          participantNames={participantNames}
          userId={userId}
          me={me}
          onToggleMic={() => setMicOn((value) => !value)}
          onToggleCam={() => setCamOn((value) => !value)}
          onFullscreen={() => setFullscreenOpen(true)}
        />
        <div className="flex min-h-0 flex-col gap-3">
          <MatchInfoBar modeName={modeName} bestOfLabel={bestOfLabel} formatName={formatName} />
          <div className="min-h-0 flex-1">
            <MatchCommentsPanel
              me={me}
              userId={userId}
              matchId={tournament.matchId}
              accessToken={accessToken}
              active={isPlayer && started && !!tournament.matchId}
              participantNames={participantNames}
              onSticker={handleSticker}
            />
          </div>
        </div>
      </div>

      <MatchFullscreenArena
        open={fullscreenOpen}
        localStream={localStream}
        remoteStream={remoteStream}
        localUsername={local.username}
        remoteUsername={remote.username}
        localFeedLabel={feedLabel}
        connecting={peerConnecting}
        camOn={camOn}
        micOn={micOn}
        onToggleCam={() => setCamOn((value) => !value)}
        onToggleMic={() => setMicOn((value) => !value)}
        onClose={() => setFullscreenOpen(false)}
      />
      <MatchIntroOverlay active={isPlayer && started} matchId={tournament.matchId} players={players} />
    </div>
  );
}

function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase hover:bg-white/15">
          <RefreshCw className="h-3.5 w-3.5" /> Riprova ora
        </button>
      )}
    </div>
  );
}

function MatchEndedNotice() {
  return (
    <p className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white/85">
      <span>La partita è terminata (fine match o abbandono dell’avversario).</span>
      <Link href="/tornei" className="rounded-full bg-gradient-to-r from-primary to-orange-500 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white hover:opacity-90">
        Torna ai tavoli
      </Link>
    </p>
  );
}
