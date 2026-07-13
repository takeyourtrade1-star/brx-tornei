'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Minimize2, Palette, Video, VideoOff } from 'lucide-react';
import { PLAYMATS, getPlaymat, type PlaymatId } from '@/lib/playmats';
import { cn } from '@/lib/utils';
import { MatchArenaLifeBadge } from './match-arena-life-badge';
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
  onToggleCam: () => void;
  onToggleMic: () => void;
  onLifeChange: (playerId: string, delta: number) => void;
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
  onToggleCam,
  onToggleMic,
  onLifeChange,
  onClose,
}: MatchFullscreenArenaProps) {
  const [mounted, setMounted] = useState(false);
  const [playmatId, setPlaymatId] = useState<PlaymatId>('ember-foundry');
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
      style={{ backgroundImage: `url(${playmat.src})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
    >
      <div className="absolute inset-0 bg-black/25" aria-hidden />
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent py-4 pl-4 pr-16 sm:pl-6 sm:pr-20">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vista tavolo</p>
          <h2 className="font-display text-lg font-black uppercase sm:text-2xl">
            {remoteUsername}
          </h2>
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

      <div className="relative z-10 grid h-full place-items-center px-3 pb-24 pt-20 sm:px-10 sm:pb-28 sm:pt-24">
        <div className="relative aspect-video w-[min(91vw,138vh)] rounded-[1.35rem] bg-black/70 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,0.7)] ring-1 ring-white/25 sm:rounded-[2rem] sm:p-2.5">
          <WebcamTile
            stream={remoteStream}
            username={remoteUsername}
            connecting={connecting}
            muted={false}
          />
          <MatchArenaLifeBadge
            username={remoteUsername}
            life={lifeByPlayerId[remotePlayerId] ?? startingLife}
            playerId={remotePlayerId}
            connected={lifeConnected}
            side="remote"
            onChange={onLifeChange}
          />
        </div>
      </div>

      <div className="absolute bottom-24 right-3 z-30 aspect-video w-[42vw] max-w-[320px] rounded-2xl bg-black/80 p-1 shadow-2xl ring-1 ring-white/30 sm:bottom-28 sm:right-6 sm:w-[25vw]">
        <WebcamTile
          stream={localStream}
          username={localUsername}
          feedLabel={localFeedLabel}
          compact
          videoDisabled={!camOn}
        />
        <MatchArenaLifeBadge
          username={localUsername}
          life={lifeByPlayerId[localPlayerId] ?? startingLife}
          playerId={localPlayerId}
          connected={lifeConnected}
          side="local"
          onChange={onLifeChange}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-3 pb-3 pt-10 sm:px-6 sm:pb-5">
        <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto rounded-2xl border border-white/15 bg-black/45 p-2 backdrop-blur-xl">
          <span className="hidden shrink-0 items-center gap-1.5 px-2 text-[10px] font-black uppercase tracking-wider text-white/70 sm:inline-flex">
            <Palette className="h-4 w-4 text-primary" />
            Tappetino
          </span>
          {PLAYMATS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPlaymatId(item.id)}
              aria-pressed={item.id === playmatId}
              className={cn(
                'relative h-11 min-w-[84px] overflow-hidden rounded-xl border text-left transition sm:h-12 sm:min-w-[108px]',
                item.id === playmatId
                  ? 'border-primary ring-2 ring-primary/60'
                  : 'border-white/15 opacity-75 hover:opacity-100',
              )}
              style={{ backgroundImage: `url(${item.src})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
            >
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/5" />
              <span className="absolute inset-x-1.5 bottom-1 truncate text-[9px] font-black uppercase text-white">
                {item.name}
              </span>
            </button>
          ))}
        </div>
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
      aria-label={`${on ? 'Spegni' : 'Accendi'} ${label}`}
      className={cn(
        'grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition',
        on ? 'border-white/20 bg-black/50 hover:bg-black/70' : 'border-red-400/50 bg-red-500/80',
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
