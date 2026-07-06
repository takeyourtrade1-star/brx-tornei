'use client';

import { useEffect, useRef } from 'react';
import { Loader2, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebcamTileProps {
  stream?: MediaStream | null;
  username: string;
  /** Variante compatta per il Picture-in-Picture. */
  compact?: boolean;
  /** Etichetta sorgente (es. "PC", "Telefono"). */
  feedLabel?: string;
  /** Stato connessione P2P (solo tile remoto). */
  connecting?: boolean;
}

/**
 * Riquadro webcam minimale: video reale o stato di attesa.
 */
export function WebcamTile({
  stream,
  username,
  compact = false,
  feedLabel,
  connecting = false,
}: WebcamTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (stream) {
      el.srcObject = stream;
      void el.play().catch(() => {});
    } else {
      el.srcObject = null;
    }
  }, [stream]);

  const hasVideo = !!stream;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-black/70">
      <video
        ref={videoRef}
        className={cn('h-full w-full object-cover', !hasVideo && 'opacity-0')}
        muted
        playsInline
        autoPlay
      />

      {!hasVideo && (
        <div className="absolute inset-0 grid place-items-center bg-black/80">
          <div className="flex flex-col items-center gap-2 text-white/45">
            {connecting ? (
              <Loader2 className={cn('animate-spin', compact ? 'h-5 w-5' : 'h-8 w-8')} />
            ) : (
              <VideoOff className={cn(compact ? 'h-5 w-5' : 'h-8 w-8')} />
            )}
            {!compact && (
              <span className="text-xs">
                {connecting ? 'Connessione video…' : 'In attesa del video'}
              </span>
            )}
          </div>
        </div>
      )}

      {hasVideo && (
        <div
          className={cn(
            'absolute left-2 top-2 rounded-full bg-emerald-500/90 font-black uppercase text-white',
            compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]',
          )}
        >
          Live
        </div>
      )}

      {feedLabel && hasVideo && (
        <div
          className={cn(
            'absolute right-2 top-2 rounded-full border border-white/20 bg-black/55 font-bold text-white/85 backdrop-blur-sm',
            compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]',
          )}
        >
          {feedLabel}
        </div>
      )}

      <div
        className={cn(
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent',
          compact ? 'px-2 pb-1 pt-4' : 'px-3 pb-2.5 pt-8',
        )}
      >
        <p className={cn('truncate font-bold text-white', compact ? 'text-[10px]' : 'text-sm')}>
          {username}
        </p>
      </div>
    </div>
  );
}
