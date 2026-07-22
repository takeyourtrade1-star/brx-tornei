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

const MAX_AUTOMATIC_RETRIES = 3;

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
  const [everConnected, setEverConnected] = useState(false);
  const ctrlRef = useRef<ReturnType<typeof createMatchPeerLink> | null>(null);
  const automaticRetries = useRef(0);

  const clearConnectionState = useCallback(() => {
    setRemoteStream(null);
    setTransport('unknown');
    setState('idle');
  }, []);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    clearConnectionState();
  }, [clearConnectionState]);

  const retry = useCallback(() => {
    automaticRetries.current = 0;
    setError(null);
    setGeneration((current) => current + 1);
  }, []);

  const notifyLeave = useCallback(async () => {
    await ctrlRef.current?.notifyLeave();
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
      onState: (nextState) => {
        if (nextState === 'connected') setEverConnected(true);
        setState(nextState);
      },
      onRemoteStream: setRemoteStream,
      onPeerLeft: () => setRemoteStream(null),
      onError: setError,
      onTransport: setTransport,
    });
    ctrlRef.current = ctrl;
    ctrl.start();

    return () => {
      ctrl.stop();
      if (ctrlRef.current === ctrl) {
        ctrlRef.current = null;
        clearConnectionState();
      }
    };
  }, [active, sessionId, role, localStream, videoTrackId, allowDirect, clearConnectionState, stop, generation]);

  useEffect(() => {
    if (state === 'connected') automaticRetries.current = 0;
  }, [state]);

  useEffect(() => {
    if (!active || state !== 'failed') return;
    automaticRetries.current += 1;
    if (automaticRetries.current > MAX_AUTOMATIC_RETRIES) return;
    const delay = Math.min(automaticRetries.current * 1_500, 12_000);
    const timer = window.setTimeout(() => {
      setError(null);
      setGeneration((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, state]);

  useEffect(() => {
    setEverConnected(false);
    automaticRetries.current = 0;
  }, [active, sessionId]);

  const reconnecting =
    everConnected &&
    (state === 'reconnecting' ||
      state === 'failed' ||
      state === 'connecting' ||
      state === 'waiting');

  return { state, remoteStream, error, transport, reconnecting, retry, notifyLeave };
}
