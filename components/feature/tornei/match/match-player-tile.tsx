'use client';

import type { ReactNode } from 'react';
import { Maximize2, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';
import type { Participant } from '@/types/tournament';
import { cn } from '@/lib/utils';
import { MatchDeckChip } from './match-deck-chip';
import { MatchLifeBadge } from './match-life-badge';
import { WebcamTile } from './webcam-tile';

export interface MatchPlayerTileProps {
  player: Participant;
  formatName: string;
  variant: 'local' | 'remote';
  roleLabel: string;
  stream?: MediaStream | null;
  feedLabel?: string;
  videoDisabled?: boolean;
  connecting?: boolean;
  muted?: boolean;
  emptyLabel?: string;
  mirrored?: boolean;
  onToggleMirror?: () => void;
  life: number;
  startingLife: number;
  lifeConnected: boolean;
  interactiveLife: boolean;
  onLifeChange: (playerId: string, delta: number) => void;
  onLifeReset?: () => void;
  micOn?: boolean;
  camOn?: boolean;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  opponentMuted?: boolean;
  onToggleOpponentMute?: () => void;
  onFullscreen?: () => void;
  disconnectOverlay?: ReactNode;
}

/**
 * Modulo player arena: barra di controllo e punti vita esterna in alto,
 * riquadro webcam 16:9 completamente libero da sovrapposizioni in basso.
 */
export function MatchPlayerTile({
  player,
  formatName,
  variant,
  roleLabel,
  stream,
  feedLabel,
  videoDisabled = false,
  connecting = false,
  muted = false,
  emptyLabel,
  mirrored = false,
  onToggleMirror,
  life,
  startingLife,
  lifeConnected,
  interactiveLife,
  onLifeChange,
  onLifeReset,
  micOn,
  camOn,
  onToggleMic,
  onToggleCam,
  opponentMuted,
  onToggleOpponentMute,
  onFullscreen,
  disconnectOverlay,
}: MatchPlayerTileProps) {
  const local = variant === 'local';

  return (
    <div
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border transition duration-200 shadow-xl',
        local
          ? 'border-primary/35 bg-gradient-to-b from-[#1c140d]/90 via-[#0e1222]/90 to-[#060814]/90 shadow-[0_16px_40px_-15px_rgba(255,115,0,0.25)] ring-1 ring-primary/20'
          : 'border-sky-400/35 bg-gradient-to-b from-[#0e1828]/90 via-[#0e1222]/90 to-[#060814]/90 shadow-[0_16px_40px_-15px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/20',
      )}
    >
      {/* Barra superiore HUD (ESTERNA AL VIDEO): identità, mazzo, punti vita e comandi */}
      <header
        className={cn(
          'flex h-12 items-center justify-between gap-2 border-b px-3.5 py-1.5 backdrop-blur-md',
          local
            ? 'border-primary/25 bg-black/40'
            : 'border-sky-400/25 bg-black/40',
        )}
      >
        {/* Identità e mazzo (senza rombi) */}
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
              local
                ? 'bg-primary/20 text-primary'
                : 'bg-sky-400/20 text-sky-300',
            )}
          >
            {roleLabel}
          </span>
          <span className="truncate font-sans text-xs sm:text-sm font-black text-white max-w-[120px] sm:max-w-[160px]">
            {player.username}
          </span>
          <MatchDeckChip player={player} formatName={formatName} />
        </div>

        {/* Punti vita fuori dal video */}
        <div className="flex items-center justify-center">
          <MatchLifeBadge
            username={player.username}
            life={life}
            playerId={player.id}
            connected={lifeConnected}
            variant={variant}
            interactive={interactiveLife}
            startingLife={startingLife}
            onChange={onLifeChange}
            onReset={onLifeReset}
            hideUsername
          />
        </div>

        {/* Controlli rapidi e Fullscreen */}
        <div className="flex items-center gap-1.5">
          {local && onToggleMic && micOn !== undefined && (
            <TileMediaButton on={micOn} kind="mic" onClick={onToggleMic} />
          )}
          {local && onToggleCam && camOn !== undefined && (
            <TileMediaButton on={camOn} kind="cam" onClick={onToggleCam} />
          )}
          {!local && onToggleOpponentMute && opponentMuted !== undefined && (
            <TileMediaButton on={!opponentMuted} kind="volume" onClick={onToggleOpponentMute} />
          )}
          {onFullscreen && (
            <button
              type="button"
              onClick={onFullscreen}
              aria-label="Apri la partita a schermo intero"
              title="Fullscreen"
              className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.08] px-2.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/30 hover:bg-white/15 active:scale-95"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          )}
        </div>
      </header>

      {/* Riquadro Webcam: 16:9 completamente sgombro per carte e playmat */}
      <div className="relative w-full overflow-hidden bg-black/80 [aspect-ratio:16/9]">
        <WebcamTile
          stream={stream}
          username={player.username}
          feedLabel={feedLabel}
          connecting={connecting}
          muted={muted}
          videoDisabled={videoDisabled}
          mirrored={mirrored}
          onToggleMirror={onToggleMirror}
          emptyLabel={emptyLabel}
          hideUsername
        />
        {disconnectOverlay}
      </div>
    </div>
  );
}

function TileMediaButton({
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
        'grid h-7 w-7 place-items-center rounded-lg border backdrop-blur-md transition active:scale-95 shadow-sm',
        on
          ? 'border-white/15 bg-white/[0.08] text-white hover:border-white/30 hover:bg-white/15'
          : 'border-red-400/50 bg-gradient-to-b from-red-500 to-red-600 text-white hover:brightness-110 shadow-[0_2px_8px_rgba(239,68,68,0.4)]',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
