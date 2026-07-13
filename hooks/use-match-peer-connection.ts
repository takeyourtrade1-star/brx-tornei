'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createMatchPeerLink,
  type PeerLinkState,
  type PeerRole,
  type PeerTransport,
} from '@/lib/webrtc/match-peer-link';

interface UseMatchPeerConnectionOptions {
  sessionId?: string | null;
  role: PeerRole;
  active: boolean;
  /** Stream webcam già acquisito (PC o telefono). */
  localStream?: MediaStream | null;
  /** Consenso esplicito a rendere visibile l'IP al peer. */
  allowDirect?: boolean;
}

/**
 * Connessione P2P volto↔volto tra host e partecipante durante il match.
 */
export function useMatchPeerConnection({
  sessionId,
  role,
  active,
  localStream,
  allowDirect = false,
}: UseMatchPeerConnectionOptions) {
  const [state, setState] = useState<PeerLinkState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<PeerTransport>('unknown');
  const [generation, setGeneration] = useState(0);
  const ctrlRef = useRef<ReturnType<typeof createMatchPeerLink> | null>(null);
  const automaticRetries = useRef(0);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setRemoteStream(null);
    setTransport('unknown');
    setState('idle');
  }, []);

  const retry = useCallback(() => {
    automaticRetries.current = 0;
    setError(null);
    setGeneration((current) => current + 1);
  }, []);

  const videoTrackId = localStream?.getVideoTracks()[0]?.id ?? null;

  useEffect(() => {
    if (!active || !sessionId || !localStream || !videoTrackId) {
      stop();
      return;
    }

    setError(null);
    setState('connecting');

    const ctrl = createMatchPeerLink(sessionId, role, localStream, allowDirect, {
      onState: setState,
      onRemoteStream: setRemoteStream,
      onError: setError,
      onTransport: setTransport,
    });
    ctrlRef.current = ctrl;
    ctrl.start();

    return () => {
      stop();
    };
  }, [active, sessionId, role, localStream, videoTrackId, allowDirect, stop, generation]);

  useEffect(() => {
    if (state === 'connected') automaticRetries.current = 0;
  }, [state]);

  useEffect(() => {
    if (!active || state !== 'failed' || automaticRetries.current >= 2) return;
    automaticRetries.current += 1;
    const delay = automaticRetries.current * 1_500;
    const timer = window.setTimeout(() => {
      setError(null);
      setGeneration((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, state]);

  return { state, remoteStream, error, transport, retry };
}
