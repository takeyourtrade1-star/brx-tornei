'use client';

import { useEffect, useRef } from 'react';
import { Radio, VideoOff } from 'lucide-react';

interface WebcamTileProps {
  /** Stream reale (telefono via QR). Se assente → anteprima simulata. */
  stream?: MediaStream | null;
  username: string;
  flag?: string;
  deck?: string;
  /** Etichetta vita o badge extra mostrato in basso. */
  badge?: string;
  /** Variante compatta per il Picture-in-Picture. */
  compact?: boolean;
}

/**
 * Riquadro webcam di un giocatore. Se riceve un MediaStream lo riproduce;
 * altrimenti mostra un'anteprima "simulata" (avatar + bande animate + LIVE)
 * così la vista match resta credibile anche senza una vera connessione.
 */
export function WebcamTile({
  stream,
  username,
  flag,
  deck,
  badge,
  compact = false,
}: WebcamTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      void videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-black/60">
      {stream ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
      ) : (
        // Anteprima simulata
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(120%_120%_at_50%_0%,#1f2a44_0%,#0c111d_70%)]">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(255,255,255,0.04)_4px)]" />
          <div className="flex flex-col items-center gap-2">
            <div
              className={`grid place-items-center rounded-full border border-white/20 bg-white/10 font-display font-black text-white/80 ${
                compact ? 'h-9 w-9 text-sm' : 'h-16 w-16 text-xl'
              }`}
            >
              {initials}
            </div>
            {!compact && (
              <span className="flex items-center gap-1 text-[11px] text-white/45">
                <VideoOff className="h-3 w-3" /> webcam simulata
              </span>
            )}
          </div>
        </div>
      )}

      {/* Badge LIVE */}
      <div
        className={`absolute left-2 top-2 flex items-center gap-1 rounded-full border border-red-400/40 bg-black/55 font-bold text-red-300 backdrop-blur-sm ${
          compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-1 text-[10px]'
        }`}
      >
        <Radio className={compact ? 'h-2.5 w-2.5 animate-pulse' : 'h-3 w-3 animate-pulse'} />
        LIVE
      </div>

      {/* Barra inferiore: nome + mazzo / vita */}
      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/85 to-transparent ${
          compact ? 'px-2 pb-1 pt-3' : 'px-3 pb-2 pt-6'
        }`}
      >
        <div className="min-w-0">
          <p
            className={`truncate font-bold text-white ${compact ? 'text-[10px]' : 'text-sm'}`}
          >
            {flag ? `${flag} ` : ''}
            {username}
          </p>
          {!compact && deck && (
            <p className="truncate font-mono text-[10px] text-white/55">{deck}</p>
          )}
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-md bg-white/10 font-black tabular-nums text-white ${
              compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-sm'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
