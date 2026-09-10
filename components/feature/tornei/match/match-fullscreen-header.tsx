'use client';

import { MessageSquare, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MatchLifeBadge } from './match-life-badge';
import { MatchMediaButton } from './match-media-button';

interface MatchFullscreenHeaderProps {
  localUsername: string;
  remoteUsername: string;
  localPlayerId: string;
  remotePlayerId: string;
  startingLife: number;
  lifeByPlayerId: Record<string, number>;
  lifeConnected: boolean;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void;
  camOn: boolean;
  micOn: boolean;
  opponentMuted?: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  onToggleOpponentMute?: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  onClose: () => void;
}

export function MatchFullscreenHeader({
  localUsername,
  remoteUsername,
  localPlayerId,
  remotePlayerId,
  startingLife,
  lifeByPlayerId,
  lifeConnected,
  onLifeChange,
  onLifeReset,
  camOn,
  micOn,
  opponentMuted = false,
  onToggleCam,
  onToggleMic,
  onToggleOpponentMute,
  chatOpen,
  onToggleChat,
  onClose,
}: MatchFullscreenHeaderProps) {
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-header-bg/95 px-4 shadow-xl backdrop-blur-xl sm:px-6">
      {/* Sinistra: Capsula Tu + Punti Vita */}
      <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-primary/30 bg-black/40 px-3 py-1 shadow-sm backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
            Tu
          </span>
          <span className="truncate text-xs font-black text-white sm:text-sm max-w-[100px] sm:max-w-[160px]">
            {localUsername}
          </span>
        </div>
        <div className="h-4 w-px bg-white/15" aria-hidden="true" />
        <MatchLifeBadge
          username={localUsername}
          life={lifeByPlayerId[localPlayerId] ?? startingLife}
          playerId={localPlayerId}
          connected={lifeConnected}
          variant="local"
          interactive
          startingLife={startingLife}
          onChange={onLifeChange}
          onReset={onLifeReset}
          hideUsername
        />
      </div>

      {/* Centro: Distintivo VS sobrio ed elegante */}
      <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-0.5 text-[11px] font-black tracking-widest text-white/40 uppercase">
        VS
      </div>

      {/* Destra: Capsula Avversario + Comandi */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* Capsula Avversario */}
        <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-sky-400/30 bg-black/40 px-3 py-1 shadow-sm backdrop-blur-md">
          <MatchLifeBadge
            username={remoteUsername}
            life={lifeByPlayerId[remotePlayerId] ?? startingLife}
            playerId={remotePlayerId}
            connected={lifeConnected}
            variant="remote"
            interactive={false}
            onChange={onLifeChange}
            hideUsername
          />
          <div className="h-4 w-px bg-white/15" aria-hidden="true" />
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs font-black text-white sm:text-sm max-w-[100px] sm:max-w-[160px]">
              {remoteUsername}
            </span>
            <span className="rounded-md bg-sky-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-300">
              Avversario
            </span>
          </div>
        </div>

        {/* Toolbar controlli multimediali, chat e riduci */}
        <div className="flex items-center gap-1.5 border-l border-white/15 pl-2">
          <MatchMediaButton on={micOn} label="microfono" onClick={onToggleMic} />
          <MatchMediaButton on={camOn} label="camera" onClick={onToggleCam} />
          {onToggleOpponentMute && (
            <MatchMediaButton on={!opponentMuted} label="audio avversario" onClick={onToggleOpponentMute} />
          )}
          <button
            type="button"
            onClick={onToggleChat}
            aria-label={chatOpen ? 'Chiudi chat' : 'Apri chat'}
            className={cn(
              'grid h-9 w-9 place-items-center rounded-xl border backdrop-blur-md transition active:scale-95 shadow-sm',
              chatOpen
                ? 'border-primary/60 bg-primary/25 text-primary shadow-[0_0_10px_rgba(255,115,0,0.3)]'
                : 'border-white/15 bg-white/[0.08] text-white hover:border-white/30 hover:bg-white/15',
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Riduci schermo intero"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.08] px-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/15 active:scale-95 shadow-sm"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden md:inline">Riduci</span>
          </button>
        </div>
      </div>
    </header>
  );
}
