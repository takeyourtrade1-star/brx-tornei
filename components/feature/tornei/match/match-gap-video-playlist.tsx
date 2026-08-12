'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import type { GapPeerClipView } from '@/lib/gap-recording/peer-review-tickets';
import {
  isGapViewTicketExpired,
  newGapPeerPlaylistState,
  reduceGapPeerPlaylist,
  restartGapPeerPlaylist,
} from '@/lib/gap-recording/peer-review-playlist';

export function MatchGapVideoPlaylist({
  recordingId,
  clips,
  onRenewTickets,
}: {
  recordingId: string;
  clips: GapPeerClipView[];
  onRenewTickets: () => Promise<boolean>;
}) {
  const [state, dispatch] = useReducer(
    reduceGapPeerPlaylist,
    newGapPeerPlaylistState(recordingId, clips.length),
  );
  const [continueRequired, setContinueRequired] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoPlayNextRef = useRef(false);
  const current = clips[state.currentIndex];

  useEffect(() => {
    dispatch({ type: 'reset', recordingId, clipCount: clips.length });
    setContinueRequired(false);
    autoPlayNextRef.current = false;
  }, [recordingId, clips.length]);

  useEffect(() => {
    if (!autoPlayNextRef.current || !current) return;
    autoPlayNextRef.current = false;
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().then(
      () => setContinueRequired(false),
      () => setContinueRequired(true),
    );
  }, [current]);

  if (!current) return null;

  const playCurrent = () => {
    const video = videoRef.current;
    if (!video) return;
    dispatch({ type: 'retry' });
    setContinueRequired(false);
    video.load();
    void video.play().catch(() => setContinueRequired(true));
  };
  const retry = async () => {
    if (!isGapViewTicketExpired(current.expiresAt)) {
      playCurrent();
      return;
    }
    setRenewing(true);
    autoPlayNextRef.current = true;
    const renewed = await onRenewTickets();
    setRenewing(false);
    if (renewed) dispatch({ type: 'retry' });
    else autoPlayNextRef.current = false;
  };
  const advance = () => {
    if (state.failed) return;
    setContinueRequired(false);
    if (state.currentIndex + 1 < state.clipCount) autoPlayNextRef.current = true;
    dispatch({ type: 'ended' });
  };
  const restart = () => {
    setContinueRequired(false);
    autoPlayNextRef.current = restartGapPeerPlaylist(
      state.currentIndex,
      () => dispatch({ type: 'reset', recordingId, clipCount: clips.length }),
      playCurrent,
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <strong className="font-bold text-white">Video della disconnessione</strong>
        <span className="tabular-nums text-slate-400">
          Frammento {state.currentIndex + 1}/{state.clipCount}
        </span>
      </div>
      <video
        ref={videoRef}
        className="aspect-video w-full rounded-xl bg-black"
        src={current.url}
        aria-label={`Frammento ${state.currentIndex + 1} di ${state.clipCount}`}
        controls
        playsInline
        preload="metadata"
        onEnded={advance}
        onError={() => dispatch({ type: 'failed' })}
        onPlaying={() => {
          dispatch({ type: 'retry' });
          setContinueRequired(false);
        }}
      />
      {state.failed && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">Il frammento non è stato saltato.</span>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-black uppercase text-white hover:bg-white/15 disabled:opacity-45"
            disabled={renewing}
            onClick={() => void retry()}
          >
            {renewing ? 'Aggiornamento…' : isGapViewTicketExpired(current.expiresAt)
              ? 'Aggiorna e riprova'
              : 'Riprova frammento'}
          </button>
        </div>
      )}
      {continueRequired && !state.failed && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="min-w-0 flex-1">Il browser ha messo in pausa il passaggio al frammento successivo.</span>
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-black uppercase text-white hover:bg-white/15"
            onClick={() => void videoRef.current?.play()}
          >
            Continua
          </button>
        </div>
      )}
      {state.completed && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300">
          <span className="min-w-0 flex-1">Riproduzione completata.</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 font-black uppercase text-white hover:bg-white/15"
            onClick={restart}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Rivedi
          </button>
        </div>
      )}
    </div>
  );
}
