'use client';

import { Maximize2, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import type { StickerShot } from '@/hooks/use-match-sticker-shot';
import { cn } from '@/lib/utils';
import { MatchDeckChip } from './match-deck-chip';
import { MatchLifeBadge } from './match-life-badge';
import { WebcamTile } from './webcam-tile';

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
  /** Testo del tile avversario quando il video non c'è (es. riconnessione in corso). */
  remoteEmptyLabel?: string;
  camOn: boolean;
  micOn: boolean;
  opponentMuted?: boolean;
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
  onFullscreen: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void;
}

export function MatchVideoGrid({
  isObserver,
  isPlayer,
  started,
  leftPlayer,
  rightPlayer,
  formatName,
  localStream,
  remoteStream,
  feedLabel,
  peerConnecting,
  remoteEmptyLabel,
  camOn,
  micOn,
  opponentMuted = false,
  lifeByPlayerId,
  startingLife,
  lifeConnected,
  stickerShot,
  participantNames,
  userId,
  me,
  onToggleMic,
  onToggleCam,
  onToggleOpponentMute,
  onFullscreen,
  onLifeChange,
  onLifeReset,
}: MatchVideoGridProps) {
  return (
    <div className="relative min-w-0">
      {stickerShot && (
        <div key={stickerShot.key} className="pointer-events-none absolute inset-0 z-30 grid place-items-center" aria-hidden>
          <div className="sticker-overlay flex flex-col items-center gap-1">
            <span
              className={cn(
                'text-7xl drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)] sm:text-8xl',
                stickerShot.sticker.animation,
              )}
            >
              {stickerShot.sticker.emoji}
            </span>
            <span className="rounded-full bg-black/60 px-3 py-1 text-sm font-black uppercase tracking-widest text-primary backdrop-blur-sm">
              {stickerShot.sticker.label}
            </span>
            <span className="text-[11px] font-bold text-white/75 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
              {stickerShot.fromUserId === userId
                ? me
                : (participantNames[stickerShot.fromUserId] ?? 'Avversario')}
            </span>
          </div>
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3.5 lg:grid-cols-2">
        {/* Lato sinistro: Tu / Locale (accenti caldi primary). */}
        <div className="group relative w-full overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-b from-primary/[0.08] via-[#0b1022] to-[#060914] shadow-[0_20px_50px_-20px_rgba(255,115,0,0.25)] ring-1 ring-primary/20 [aspect-ratio:16/9] transition duration-200">
          <div className="absolute inset-0">
            {isObserver ? (
              <WebcamTile username={leftPlayer.username} hideUsername emptyLabel="Video non disponibile agli osservatori" />
            ) : (
              <WebcamTile
                stream={localStream}
                username={leftPlayer.username}
                feedLabel={feedLabel}
                videoDisabled={!camOn}
                hideUsername
              />
            )}
          </div>
          <div className="absolute left-2.5 top-2.5 z-20">
            <MatchDeckChip player={leftPlayer} formatName={formatName} />
          </div>
          {isPlayer && localStream && (
            <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-1.5">
              <MediaButton on={micOn} kind="mic" onClick={onToggleMic} />
              <MediaButton on={camOn} kind="cam" onClick={onToggleCam} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center">
            <div className="pointer-events-auto min-w-0">
              <MatchLifeBadge
                username={leftPlayer.username}
                life={lifeByPlayerId[leftPlayer.id] ?? startingLife}
                playerId={leftPlayer.id}
                connected={lifeConnected}
                variant="local"
                roleLabel={isPlayer ? 'Tu' : null}
                interactive={isPlayer && started}
                startingLife={startingLife}
                onChange={onLifeChange}
                onReset={onLifeReset}
              />
            </div>
          </div>
        </div>

        {/* Lato destro: Avversario / Remoto (accenti freddi sky/cyan). */}
        <div className="group relative w-full overflow-hidden rounded-2xl border border-sky-400/35 bg-gradient-to-b from-sky-400/[0.08] via-[#0b1022] to-[#060914] shadow-[0_20px_50px_-20px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/20 [aspect-ratio:16/9] transition duration-200">
          <div className="absolute inset-0">
            <WebcamTile
              stream={isPlayer ? remoteStream : null}
              username={rightPlayer.username}
              connecting={isPlayer ? peerConnecting : false}
              muted={isPlayer ? opponentMuted : true}
              hideUsername
              emptyLabel={isObserver ? 'Video non disponibile agli osservatori' : remoteEmptyLabel}
            />
          </div>
          <div className="absolute left-2.5 top-2.5 z-20">
            <MatchDeckChip player={rightPlayer} formatName={formatName} />
          </div>
          <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1.5">
            {isPlayer && started && (
              <button
                type="button"
                onClick={onFullscreen}
                aria-label="Apri la modalita tavolo in fullscreen"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/15 bg-header-bg/80 px-3 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/15"
              >
                <Maximize2 className="h-3 w-3" />
                Fullscreen
              </button>
            )}
          </div>
          {isPlayer && remoteStream && onToggleOpponentMute && (
            <div className="absolute bottom-2.5 right-2.5 z-20">
              <MediaButton
                on={!opponentMuted}
                kind="volume"
                onClick={onToggleOpponentMute}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex justify-center">
            <div className="pointer-events-auto min-w-0">
              <MatchLifeBadge
                username={rightPlayer.username}
                life={lifeByPlayerId[rightPlayer.id] ?? startingLife}
                playerId={rightPlayer.id}
                connected={lifeConnected}
                variant="remote"
                roleLabel={isPlayer ? 'Avversario' : null}
                interactive={false}
                onChange={onLifeChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaButton({
  on,
  kind,
  onClick,
}: {
  on: boolean;
  kind: 'mic' | 'cam' | 'volume';
  onClick: () => void;
}) {
  const Icon =
    kind === 'mic'
      ? on
        ? Mic
        : MicOff
      : kind === 'cam'
        ? on
          ? Video
          : VideoOff
        : on
          ? Volume2
          : VolumeX;

  const label =
    kind === 'mic'
      ? (on ? 'Spegni ' : 'Accendi ') + 'microfono'
      : kind === 'cam'
        ? (on ? 'Spegni ' : 'Accendi ') + 'camera'
        : on
          ? 'Silenzia audio avversario'
          : 'Riattiva audio avversario';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={!on}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-full border backdrop-blur-md transition active:scale-95 shadow-sm',
        on
          ? 'border-white/15 bg-header-bg/85 text-white hover:border-white/30 hover:bg-white/15'
          : 'border-red-400/50 bg-gradient-to-b from-red-500 to-red-600 text-white hover:brightness-110 shadow-[0_4px_12px_rgba(239,68,68,0.4)]',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
