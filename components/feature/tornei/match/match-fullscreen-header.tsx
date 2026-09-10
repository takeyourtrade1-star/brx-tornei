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

/**
 * HUD superiore fullscreen: capsule giocatore con vita inline sopra i video.
 * Solo presentazione: stessi props e callback di prima.
 */
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
    <header className="relative z-30 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-header-bg/95 px-3 py-2 shadow-xl backdrop-blur-xl sm:gap-3 sm:px-5">
      {/* Filo luce in basso */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      {/* Sinistra: capsula Tu */}
      <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/[0.14] to-black/50 px-3 py-2 shadow-[0_8px_24px_-10px_rgba(255,115,0,0.6)] backdrop-blur-md">
        <span className="shrink-0 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-[0_0_12px_rgba(255,115,0,0.5)]">
          Tu
        </span>
        <span className="truncate text-xs font-black text-white sm:text-sm max-w-[80px] sm:max-w-[140px]">
          {localUsername}
        </span>
      </div>

      {/* Centro: vite vicine al VS */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 sm:gap-3">
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
          layout="inline"
        />
        <div className="hidden shrink-0 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.05] px-5 py-1.5 shadow-[0_0_20px_-4px_rgba(255,115,0,0.4)] md:flex" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(255,115,0,0.9)]" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.35em] text-white/80">VS</span>
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
        </div>
        <MatchLifeBadge
          username={remoteUsername}
          life={lifeByPlayerId[remotePlayerId] ?? startingLife}
          playerId={remotePlayerId}
          connected={lifeConnected}
          variant="remote"
          interactive={false}
          onChange={onLifeChange}
          hideUsername
          layout="inline"
        />
      </div>

      {/* Destra: capsula avversario + toolbar */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex min-w-0 items-center gap-1.5 rounded-2xl border border-sky-400/40 bg-gradient-to-b from-sky-400/[0.14] to-black/50 px-3 py-2 shadow-[0_8px_24px_-10px_rgba(56,189,248,0.6)] backdrop-blur-md">
          <span className="truncate text-xs font-black text-white sm:text-sm max-w-[80px] sm:max-w-[140px]">
            {remoteUsername}
          </span>
          <span className="shrink-0 rounded-lg bg-sky-400/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#060814] shadow-[0_0_12px_rgba(56,189,248,0.5)]">
            Avversario
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
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
