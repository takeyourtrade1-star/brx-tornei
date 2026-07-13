'use client';

import { Maximize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
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
  camOn: boolean;
  micOn: boolean;
  lifeByPlayerId: Record<string, number>;
  startingLife: number;
  lifeConnected: boolean;
  stickerShot: StickerShot | null;
  participantNames: Record<string, string>;
  userId: string;
  me: string;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onFullscreen: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset: () => void;
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
  camOn,
  micOn,
  lifeByPlayerId,
  startingLife,
  lifeConnected,
  stickerShot,
  participantNames,
  userId,
  me,
  onToggleMic,
  onToggleCam,
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

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Lato sinistro: tu (o giocatore A per gli osservatori). */}
        <div className="relative w-full overflow-hidden rounded-2xl [aspect-ratio:16/9]">
          <div className="absolute inset-0">
            {isObserver ? (
              <WebcamTile username={leftPlayer.username} hideUsername />
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
          <div className="absolute left-2 top-9 z-20">
            <MatchDeckChip player={leftPlayer} formatName={formatName} />
          </div>
          {isPlayer && localStream && (
            <div className="absolute bottom-2 right-2 z-20 flex flex-col gap-1.5">
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

        {/* Lato destro: avversario (o giocatore B per gli osservatori). */}
        <div className="relative w-full overflow-hidden rounded-2xl [aspect-ratio:16/9]">
          <div className="absolute inset-0">
            <WebcamTile
              stream={isPlayer ? remoteStream : null}
              username={rightPlayer.username}
              connecting={isPlayer ? peerConnecting : false}
              muted={false}
              hideUsername
            />
          </div>
          <div className="absolute left-2 top-9 z-20">
            <MatchDeckChip player={rightPlayer} formatName={formatName} />
          </div>
          {isPlayer && started && (
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="Apri la modalita tavolo in fullscreen"
              className="absolute right-2 top-2 z-20 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-black/60 px-3 text-[10px] font-black uppercase text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </button>
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
                interactive={isPlayer && started}
                onChange={onLifeChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaButton({ on, kind, onClick }: { on: boolean; kind: 'mic' | 'cam'; onClick: () => void }) {
  const Icon = kind === 'mic' ? (on ? Mic : MicOff) : on ? Video : VideoOff;
  const label = kind === 'mic' ? 'microfono' : 'camera';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={(on ? 'Spegni ' : 'Accendi ') + label}
      aria-pressed={!on}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full border backdrop-blur-sm transition active:scale-95',
        on
          ? 'border-white/25 bg-black/50 text-white hover:bg-black/70'
          : 'border-red-500/50 bg-red-500/80 text-white hover:bg-red-500',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
