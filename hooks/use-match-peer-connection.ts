'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createMatchPeerLink,
  type PeerLinkState,
  type PeerRole,
} from '@/lib/webrtc/match-peer-link';

interface UseMatchPeerConnectionOptions {
  sessionId?: string | null;
  role: PeerRole;
  active: boolean;
  /** Stream webcam già acquisito (PC o telefono). */
  localStream?: MediaStream | null;
}

/**
 * Connessione P2P volto↔volto tra host e partecipante durante il match.
 */
export function useMatchPeerConnection({
  sessionId,
  role,
  active,
  localStream,
}: UseMatchPeerConnectionOptions) {
  const [state, setState] = useState<PeerLinkState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctrlRef = useRef<ReturnType<typeof createMatchPeerLink> | null>(null);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setRemoteStream(null);
    setState('idle');
  }, []);

  const videoTrackId = localStream?.getVideoTracks()[0]?.id ?? null;

  useEffect(() => {
    if (!active || !sessionId || !localStream || !videoTrackId) {
      stop();
      return;
    }

    setError(null);
    setState('connecting');

    const ctrl = createMatchPeerLink(sessionId, role, localStream, {
      onState: setState,
      onRemoteStream: setRemoteStream,
      onError: setError,
    });
    ctrlRef.current = ctrl;
    ctrl.start();

    return () => {
      stop();
    };
  }, [active, sessionId, role, localStream, videoTrackId, stop]);

  return { state, remoteStream, error };
}
