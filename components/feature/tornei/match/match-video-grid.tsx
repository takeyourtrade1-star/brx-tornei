'use client';

import { Maximize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import type { StickerShot } from '@/hooks/use-match-sticker-shot';
import { cn } from '@/lib/utils';
import { DeckStrip } from './match-live-parts';
import { WebcamTile } from './webcam-tile';

interface MatchVideoGridProps {
  isObserver: boolean;
  isPlayer: boolean;
  started: boolean;
  playerA: Participant;
  local: Participant;
  remote: Participant;
  leftPlayer: Participant;
  rightPlayer: Participant;
  formatName: string;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  feedLabel?: string;
  peerConnecting: boolean;
  camOn: boolean;
  micOn: boolean;
  stickerShot: StickerShot | null;
  participantNames: Record<string, string>;
  userId: string;
  me: string;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onFullscreen: () => void;
}

export function MatchVideoGrid({
  isObserver,
  isPlayer,
  started,
  playerA,
  local,
  remote,
  leftPlayer,
  rightPlayer,
  formatName,
  localStream,
  remoteStream,
  feedLabel,
  peerConnecting,
  camOn,
  micOn,
  stickerShot,
  participantNames,
  userId,
  me,
  onToggleMic,
  onToggleCam,
  onFullscreen,
}: MatchVideoGridProps) {
  return (
    <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      <div className="flex flex-col gap-2">
        <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
          {isObserver ? (
            <WebcamTile username={playerA.username} />
          ) : (
            <WebcamTile
              stream={localStream}
              username={local.username}
              feedLabel={feedLabel}
              videoDisabled={!camOn}
            />
          )}
          {isPlayer && (
            <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-black uppercase text-white backdrop-blur-sm">
              Tu
            </span>
          )}
          {isPlayer && localStream && (
            <div className="absolute bottom-2 right-2 z-10 flex gap-1.5">
              <MediaButton on={micOn} kind="mic" onClick={onToggleMic} />
              <MediaButton on={camOn} kind="cam" onClick={onToggleCam} />
            </div>
          )}
          {isPlayer && !micOn && (
            <span className="pointer-events-none absolute left-2 top-9 z-10 grid h-6 w-6 place-items-center rounded-full bg-red-500/85 text-white">
              <MicOff className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
        <DeckStrip player={leftPlayer} formatName={formatName} />
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative aspect-video sm:aspect-auto sm:min-h-[300px]">
          <WebcamTile
            stream={isPlayer ? remoteStream : null}
            username={remote.username}
            connecting={isPlayer ? peerConnecting : false}
            muted={false}
          />
          {isPlayer && started && (
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="Mostra l'avversario in fullscreen"
              className="absolute right-2 top-2 z-20 inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-black/60 px-3 text-[10px] font-black uppercase text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Fullscreen
            </button>
          )}
        </div>
        <DeckStrip player={rightPlayer} formatName={formatName} />
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
      aria-label={`${on ? 'Spegni' : 'Accendi'} ${label}`}
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
