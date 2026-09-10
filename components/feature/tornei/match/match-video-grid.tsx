'use client';

import type { Participant } from '@/types/tournament';
import type { StickerShot } from '@/hooks/use-match-sticker-shot';
import { cn } from '@/lib/utils';
import { MatchWebcamDisconnectOverlay } from './match-live-parts';
import { MatchPlayerTile } from './match-player-tile';
import { MatchStickerIcon } from './match-sticker-icons';

interface MatchVideoGridProps {
  isObserver: boolean;
  isPlayer: boolean;
  started: boolean;
  leftPlayer: Participant;
  rightPlayer: Participant;
  formatName: string;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  feedLabel?: string;
  peerConnecting: boolean;
  peerReconnecting?: boolean;
  graceRemaining?: number | null;
  disconnectedIsMe?: boolean;
  remoteEmptyLabel?: string;
  camOn: boolean;
  micOn: boolean;
  opponentMuted?: boolean;
  mirroredLocal?: boolean;
  mirroredRemote?: boolean;
  lifeByPlayerId: Record<string, number>;
  startingLife: number;
  lifeConnected: boolean;
  stickerShot: StickerShot | null;
  participantNames: Record<string, string>;
  userId: string;
  me: string;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleOpponentMute?: () => void;
  onToggleMirrorLocal?: () => void;
  onToggleMirrorRemote?: () => void;
  onFullscreen: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void;
  onRetryPeer?: () => void;
}

export function MatchVideoGrid({
  isObserver, isPlayer, started, leftPlayer, rightPlayer, formatName,
  localStream, remoteStream, feedLabel, peerConnecting, peerReconnecting = false,
  graceRemaining = null, disconnectedIsMe = false, remoteEmptyLabel,
  camOn, micOn, opponentMuted = false, mirroredLocal = false,
  mirroredRemote = false, lifeByPlayerId, startingLife, lifeConnected,
  stickerShot, participantNames, userId, me, onToggleMic, onToggleCam,
  onToggleOpponentMute, onToggleMirrorLocal, onToggleMirrorRemote,
  onFullscreen, onLifeChange, onLifeReset, onRetryPeer,
}: MatchVideoGridProps) {
  return (
    <div className="relative min-w-0">
      {stickerShot && (
        <div key={stickerShot.key} className="pointer-events-none absolute inset-0 z-30 grid place-items-center" aria-hidden>
          <div className="sticker-overlay flex flex-col items-center gap-1.5">
            <div className={cn('h-24 w-24 sm:h-32 sm:w-32 drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]', stickerShot.sticker.animation)}>
              <MatchStickerIcon id={stickerShot.sticker.id} />
            </div>
            <span className="rounded-full border border-primary/40 bg-black/75 px-3.5 py-1 font-sans text-xs font-black uppercase tracking-widest text-primary backdrop-blur-md shadow-lg">
              {stickerShot.sticker.label}
            </span>
            <span className="text-[11px] font-bold text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
              {stickerShot.fromUserId === userId ? me : (participantNames[stickerShot.fromUserId] ?? 'Avversario')}
            </span>
          </div>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3.5 lg:grid-cols-2">
        <MatchPlayerTile
          player={leftPlayer}
          formatName={formatName}
          variant="local"
          roleLabel={isObserver ? 'Giocatore 1' : 'Tu'}
          stream={isObserver ? null : localStream}
          feedLabel={feedLabel}
          videoDisabled={!camOn}
          emptyLabel={isObserver ? 'Video non disponibile agli osservatori' : undefined}
          mirrored={mirroredLocal}
          onToggleMirror={onToggleMirrorLocal}
          life={lifeByPlayerId[leftPlayer.id] ?? startingLife}
          startingLife={startingLife}
          lifeConnected={lifeConnected}
          interactiveLife={isPlayer && started}
          onLifeChange={onLifeChange}
          onLifeReset={onLifeReset}
          micOn={micOn}
          camOn={camOn}
          onToggleMic={isPlayer ? onToggleMic : undefined}
          onToggleCam={isPlayer ? onToggleCam : undefined}
          disconnectOverlay={
            isPlayer && disconnectedIsMe ? (
              <MatchWebcamDisconnectOverlay
                reconnecting={peerReconnecting}
                remaining={graceRemaining}
                disconnectedIsMe={true}
                opponentName={leftPlayer.username}
                onRetry={onRetryPeer}
              />
            ) : undefined
          }
        />

        <MatchPlayerTile
          player={rightPlayer}
          formatName={formatName}
          variant="remote"
          roleLabel={isObserver ? 'Giocatore 2' : 'Avversario'}
          stream={isPlayer ? remoteStream : null}
          connecting={isPlayer ? peerConnecting : false}
          muted={isPlayer ? opponentMuted : true}
          emptyLabel={isObserver ? 'Video non disponibile agli osservatori' : remoteEmptyLabel}
          mirrored={mirroredRemote}
          onToggleMirror={onToggleMirrorRemote}
          life={lifeByPlayerId[rightPlayer.id] ?? startingLife}
          startingLife={startingLife}
          lifeConnected={lifeConnected}
          interactiveLife={false}
          onLifeChange={onLifeChange}
          opponentMuted={opponentMuted}
          onToggleOpponentMute={isPlayer ? onToggleOpponentMute : undefined}
          onFullscreen={isPlayer && started ? onFullscreen : undefined}
          disconnectOverlay={
            isPlayer && !disconnectedIsMe ? (
              <MatchWebcamDisconnectOverlay
                reconnecting={peerReconnecting}
                remaining={graceRemaining}
                disconnectedIsMe={false}
                opponentName={rightPlayer.username}
                onRetry={onRetryPeer}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
