'use client';

import { useEffect, useRef } from 'react';
import { FlipHorizontal, Loader2, VideoOff } from 'lucide-react';
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
  /** false per sentire l'audio (solo tile remoto: il locale resta muto per l'eco). */
  muted?: boolean;
  /** true quando il giocatore ha spento la camera (track disabilitata). */
  videoDisabled?: boolean;
  /** Nasconde il nome in basso quando l'identità è già mostrata da un overlay esterno. */
  hideUsername?: boolean;
  /** Messaggio esplicito quando il ruolo non riceve uno stream video. */
  emptyLabel?: string;
  /** Specchia orizzontalmente il video (effetto specchio). */
  mirrored?: boolean;
  /** Callback per attivare/disattivare l'effetto specchio. */
  onToggleMirror?: () => void;
}

/**
 * Riquadro webcam: video con supporto orientamento/specchio e fallback di stato.
 */
export function WebcamTile({
  stream,
  username,
  compact = false,
  feedLabel,
  connecting = false,
  muted = true,
  videoDisabled = false,
  hideUsername = false,
  emptyLabel,
  mirrored = false,
  onToggleMirror,
}: WebcamTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = muted; // React non riaggiorna l'attributo muted: si imposta la property
    if (stream) {
      el.srcObject = stream;
      void el.play().catch(() => {
        // Autoplay con audio bloccato dal browser: riprova muto, il video resta visibile.
        el.muted = true;
        void el.play().catch(() => {});
      });
    } else {
      el.srcObject = null;
    }
  }, [stream, muted]);

  const hasVideo = !!stream;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-black/70">
      {/* object-contain: il frame della camera non va MAI ritagliato. */}
      <video
        ref={videoRef}
        className={cn(
          'h-full w-full object-contain transition-transform duration-200',
          mirrored && '-scale-x-100',
          !hasVideo && 'opacity-0',
        )}
        muted={muted}
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
                {emptyLabel ?? (connecting ? 'Connessione video…' : 'In attesa del video')}
              </span>
            )}
          </div>
        </div>
      )}

      {hasVideo && videoDisabled && (
        <div className="absolute inset-0 grid place-items-center bg-black/85">
          <div className="flex flex-col items-center gap-2 text-white/50">
            <VideoOff className={cn(compact ? 'h-5 w-5' : 'h-8 w-8')} />
            {!compact && <span className="text-xs">Camera spenta</span>}
          </div>
        </div>
      )}

      {onToggleMirror && hasVideo && (
        <button
          type="button"
          onClick={onToggleMirror}
          title={mirrored ? 'Visuale specchiata attiva (clicca per disattivare)' : 'Visuale normale (clicca per specchiare)'}
          aria-label={mirrored ? 'Disattiva specchio webcam' : 'Attiva specchio webcam'}
          className={cn(
            'absolute top-2.5 z-20 grid place-items-center rounded-full border transition backdrop-blur-md active:scale-95',
            feedLabel ? 'right-12 sm:right-14' : 'right-2.5',
            compact ? 'h-6 w-6' : 'h-7 w-7',
            mirrored
              ? 'border-primary/60 bg-primary/25 text-primary shadow-[0_0_10px_rgba(255,115,0,0.3)]'
              : 'border-white/20 bg-black/60 text-white/75 hover:bg-black/80 hover:text-white',
          )}
        >
          <FlipHorizontal className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        </button>
      )}

      {feedLabel && hasVideo && (
        <div
          className={cn(
            'absolute right-2.5 top-2.5 rounded-full border border-white/20 bg-black/55 font-bold text-white/85 backdrop-blur-sm',
            compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[10px]',
          )}
        >
          {feedLabel}
        </div>
      )}

      {!hideUsername && (
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
      )}
    </div>
  );
}
