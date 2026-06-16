'use client';

import { useLocalWebcam } from '@/hooks/use-local-webcam';
import { WebcamTile } from './webcam-tile';

interface PlayerDualWebcamProps {
  /** Flusso telefono (mani), da WebRTC/QR. */
  handsStream?: MediaStream | null;
  username: string;
  flag?: string;
  deck?: string;
  badge?: string;
  /** Avvia la webcam del PC quando la vista è visibile. */
  active: boolean;
  /** Badge "Tu" in alto a destra. */
  showSelfBadge?: boolean;
}

/**
 * Doppia inquadratura del giocatore: volto (webcam PC) + mani (telefono via QR).
 */
export function PlayerDualWebcam({
  handsStream,
  username,
  flag,
  deck,
  badge,
  active,
  showSelfBadge = true,
}: PlayerDualWebcamProps) {
  const { stream: faceStream, error: faceError } = useLocalWebcam(active);

  return (
    <div className="relative flex h-full min-h-[280px] flex-col gap-2">
      <div className="relative min-h-0 flex-[3]">
        <WebcamTile
          stream={handsStream}
          username={username}
          flag={flag}
          deck={deck}
          badge={badge}
          feedLabel="Mani · telefono"
        />
      </div>
      <div className="relative min-h-0 flex-[2]">
        <WebcamTile
          stream={faceStream}
          username={username}
          feedLabel="Volto · PC"
          compact
        />
        {faceError && (
          <p className="absolute inset-x-2 bottom-2 rounded-lg bg-black/75 px-2 py-1 text-center text-[10px] leading-snug text-amber-200/90">
            {faceError}
          </p>
        )}
      </div>
      {showSelfBadge && (
        <span className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-emerald-500/85 px-2 py-0.5 text-[10px] font-black uppercase text-white">
          Tu
        </span>
      )}
    </div>
  );
}
