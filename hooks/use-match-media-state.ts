'use client';

import { useEffect, useState } from 'react';

/** Stato locale dei controlli media e applicazione immediata alle tracce. */
export function useMatchMediaState(stream?: MediaStream | null) {
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [opponentMuted, setOpponentMuted] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  useEffect(() => {
    if (!stream) return;
    for (const track of stream.getVideoTracks()) track.enabled = camOn;
    for (const track of stream.getAudioTracks()) track.enabled = micOn;
  }, [stream, camOn, micOn]);

  return {
    camOn,
    setCamOn,
    micOn,
    setMicOn,
    opponentMuted,
    setOpponentMuted,
    fullscreenOpen,
    setFullscreenOpen,
  };
}
