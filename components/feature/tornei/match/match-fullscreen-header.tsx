'use client';

import { Columns2, Maximize, MessageSquare, Minimize2 } from 'lucide-react';
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
  viewMode: 'split' | 'focus';
  onViewModeChange: (mode: 'split' | 'focus') => void;
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
  viewMode,
  onViewModeChange,
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
    <header className="relative z-30 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-header-bg/95 px-3 py-2 shadow-xl backdrop-blur-xl sm:px-6">
      {/* Sinistra: Tu + Punti Vita */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="hidden min-w-0 flex-col sm:flex">
          <span className="text-[9px] font-black uppercase tracking-widest text-primary">Tu</span>
          <span className="truncate text-xs font-black text-white">{localUsername}</span>
        </div>
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

      {/* Centro: Switcher Vista (Affiancata vs Focus) */}
      <div className="flex items-center rounded-xl border border-white/15 bg-black/40 p-0.5 shadow-inner">
        <button
          type="button"
          onClick={() => onViewModeChange('split')}
          aria-pressed={viewMode === 'split'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition',
            viewMode === 'split' ? 'bg-primary text-white shadow-md' : 'text-white/60 hover:text-white',
          )}
        >
          <Columns2 className="h-3 w-3" />
          <span className="hidden sm:inline">Affiancata</span>
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('focus')}
          aria-pressed={viewMode === 'focus'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition',
            viewMode === 'focus' ? 'bg-sky-500 text-white shadow-md' : 'text-white/60 hover:text-white',
          )}
        >
          <Maximize className="h-3 w-3" />
          <span className="hidden sm:inline">Focus</span>
        </button>
      </div>

      {/* Destra: Punti Vita Avversario + Comandi multimediali + Chat + Riduci */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
        <div className="hidden min-w-0 flex-col text-right sm:flex">
          <span className="text-[9px] font-black uppercase tracking-widest text-sky-400">Avversario</span>
          <span className="truncate text-xs font-black text-white">{remoteUsername}</span>
        </div>
        <div className="flex items-center gap-1.5 pl-1 border-l border-white/15">
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
              'grid h-10 w-10 place-items-center rounded-full border backdrop-blur-md transition active:scale-95',
              chatOpen ? 'border-primary/60 bg-primary/25 text-primary' : 'border-white/20 bg-black/50 hover:bg-black/70 text-white',
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Riduci schermo intero"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 text-xs font-black uppercase backdrop-blur-md hover:bg-black/70"
          >
            <Minimize2 className="h-4 w-4" />
            <span className="hidden md:inline">Riduci</span>
          </button>
        </div>
      </div>
    </header>
  );
}
