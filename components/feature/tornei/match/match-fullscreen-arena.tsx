'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Minimize2, Video, VideoOff } from 'lucide-react';
import { getPlaymat, type PlaymatId } from '@/lib/playmats';
import { cn } from '@/lib/utils';
import { MatchCompactChat, type MatchCompactChatProps } from './match-compact-chat';
import { MatchLifeBadge } from './match-life-badge';
import { WebcamTile } from './webcam-tile';

interface MatchFullscreenArenaProps {
  open: boolean;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  localUsername: string;
  remoteUsername: string;
  localPlayerId: string;
  remotePlayerId: string;
  localFeedLabel?: string;
  connecting?: boolean;
  camOn: boolean;
  micOn: boolean;
  startingLife: number;
  lifeByPlayerId: Record<string, number>;
  lifeConnected: boolean;
  playmatId: PlaymatId;
  chat: MatchCompactChatProps;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset: () => void;
  onClose: () => void;
}

export function MatchFullscreenArena({
  open,
  localStream,
  remoteStream,
  localUsername,
  remoteUsername,
  localPlayerId,
  remotePlayerId,
  localFeedLabel,
  connecting = false,
  camOn,
  micOn,
  startingLife,
  lifeByPlayerId,
  lifeConnected,
  playmatId,
  chat,
  onToggleCam,
  onToggleMic,
  onLifeChange,
  onLifeReset,
  onClose,
}: MatchFullscreenArenaProps) {
  const [mounted, setMounted] = useState(false);
  const playmat = getPlaymat(playmatId);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <section
      role="dialog"
      aria-modal="true"
      aria-label="Partita in fullscreen"
      className="fixed inset-0 z-[1200] overflow-hidden bg-header-bg text-white"
      style={{ backgroundImage: 'url(' + playmat.src + ')', backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <div className="absolute inset-0 bg-black/35" aria-hidden />
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 to-transparent py-4 pl-4 pr-16 sm:pl-6 sm:pr-20">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Il tuo tavolo</p>
          <h2 className="font-sans text-lg font-black sm:text-xl">{localUsername}</h2>
        </div>
        <div className="flex items-center gap-2">
          <MediaButton on={micOn} label="microfono" onClick={onToggleMic} />
          <MediaButton on={camOn} label="camera" onClick={onToggleCam} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Riduci fullscreen"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 text-xs font-black uppercase backdrop-blur-md hover:bg-black/70 sm:px-4"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden sm:inline">Riduci</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 grid h-full place-items-center px-3 pb-24 pt-20 sm:px-10 sm:pt-24">
        <div className="relative w-[min(91vw,138vh)] overflow-hidden rounded-[1.35rem] bg-black/70 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.7)] ring-1 ring-primary/35 [aspect-ratio:16/9] sm:rounded-[2rem] sm:p-2.5">
          <div className="absolute inset-1.5 sm:inset-2.5">
            <WebcamTile
              stream={localStream}
              username={localUsername}
              feedLabel={localFeedLabel}
              videoDisabled={!camOn}
            />
          </div>
          <span className="pointer-events-none absolute left-5 top-5 z-10 rounded-full bg-primary px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
            La tua webcam
          </span>
        </div>
      </div>

      {/* Avversario: punti vita a lato della sua webcam, non sotto. */}
      <div className="absolute bottom-5 right-4 z-40 flex items-end gap-2">
        <div className="min-w-0">
          <MatchLifeBadge
            username={remoteUsername}
            life={lifeByPlayerId[remotePlayerId] ?? startingLife}
            playerId={remotePlayerId}
            connected={lifeConnected}
            variant="remote"
            roleLabel="Avversario"
            onChange={onLifeChange}
          />
        </div>
        <div className="w-[min(28vw,300px)] rounded-2xl border border-sky-400/30 bg-black/75 p-1.5 shadow-[0_22px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:min-w-[240px]">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-sky-300">Avversario</span>
            <span className="truncate pl-2 text-[10px] font-bold text-white">{remoteUsername}</span>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl [aspect-ratio:16/9]">
            <div className="absolute inset-0">
              <WebcamTile
                stream={remoteStream}
                username={remoteUsername}
                connecting={connecting}
                muted={false}
                compact
                hideUsername
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2">
        <MatchLifeBadge
          username={localUsername}
          life={lifeByPlayerId[localPlayerId] ?? startingLife}
          playerId={localPlayerId}
          connected={lifeConnected}
          variant="local"
          roleLabel="Tu"
          startingLife={startingLife}
          onChange={onLifeChange}
          onReset={onLifeReset}
        />
      </div>

      <div className="absolute bottom-5 left-4 z-40 hidden w-80 md:block">
        <MatchCompactChat {...chat} />
      </div>
    </section>,
    document.body,
  );
}

function MediaButton({ on, label, onClick }: { on: boolean; label: 'camera' | 'microfono'; onClick: () => void }) {
  const Icon = label === 'camera' ? (on ? Video : VideoOff) : on ? Mic : MicOff;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={(on ? 'Spegni ' : 'Accendi ') + label}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition',
        on ? 'border-white/20 bg-black/50 hover:bg-black/70' : 'border-red-400/50 bg-red-500/80',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
