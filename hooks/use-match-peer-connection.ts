'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  reportConnectionQualityAction,
  reportPeerAliveAction,
  reportPeerLostAction,
} from '@/actions/matches';
import {
  createMatchPeerLink,
  type PeerLinkState,
  type PeerRole,
  type PeerTransport,
} from '@/lib/webrtc/match-peer-link';
import type { ConnectionQuality } from '@/types/tournament';

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
  const [quality, setQuality] = useState<ConnectionQuality>();
  const [relayFallback, setRelayFallback] = useState(false);
  const ctrlRef = useRef<ReturnType<typeof createMatchPeerLink> | null>(null);
  const qualityRef = useRef<ConnectionQuality>();
  const automaticRetries = useRef(0);

  const clearConnectionState = useCallback(() => {
    setRemoteStream(null);
    setTransport('unknown');
    setQuality(undefined);
    qualityRef.current = undefined;
    setState('idle');
  }, []);

  const stop = useCallback(() => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    clearConnectionState();
  }, [clearConnectionState]);

  const retry = useCallback(() => {
    automaticRetries.current = 0;
    setRelayFallback(false);
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

    const ctrl = createMatchPeerLink(sessionId, role, localStream, allowDirect && !relayFallback, {
      onState: (nextState) => {
        if (nextState === 'connected') setEverConnected(true);
        setState(nextState);
      },
      onRemoteStream: setRemoteStream,
      onPeerLeft: () => setRemoteStream(null),
      onSessionEnded: () => setRemoteStream(null),
      onError: setError,
      onTransport: setTransport,
      onQuality: (sample) => {
        qualityRef.current = sample;
        setQuality(sample);
        void reportConnectionQualityAction(sessionId, sample);
      },
      onPeerLost: () => {
        const current = qualityRef.current;
        const degraded: ConnectionQuality = {
          level: 'poor',
          rttMs: current?.rttMs,
          packetLossPct: current?.packetLossPct,
          jitterMs: current?.jitterMs,
          transport: current?.transport ?? 'unknown',
          checkedAt: new Date().toISOString(),
        };
        qualityRef.current = degraded;
        setQuality(degraded);
        void reportConnectionQualityAction(sessionId, degraded);
        void reportPeerLostAction(sessionId);
      },
      onPeerAlive: () => {
        void reportPeerAliveAction(sessionId);
      },
    });
    ctrlRef.current = ctrl;
    ctrl.start();
    const notifyPageExit = () => {
      void ctrl.notifyOffline();
    };
    window.addEventListener('pagehide', notifyPageExit);

    return () => {
      window.removeEventListener('pagehide', notifyPageExit);
      ctrl.stop();
      if (ctrlRef.current === ctrl) {
        ctrlRef.current = null;
        clearConnectionState();
      }
    };
  }, [active, sessionId, role, localStream, videoTrackId, allowDirect, relayFallback, clearConnectionState, stop, generation]);

  useEffect(() => {
    if (state === 'connected') automaticRetries.current = 0;
  }, [state]);

  useEffect(() => {
    if (!active || state !== 'failed') return;
    if (allowDirect && !relayFallback) {
      setError('Connessione diretta instabile: attivo il fallback relay…');
      setRelayFallback(true);
      return;
    }
    automaticRetries.current += 1;
    if (automaticRetries.current > MAX_AUTOMATIC_RETRIES) return;
    const delay = Math.min(automaticRetries.current * 1_500, 12_000);
    const timer = window.setTimeout(() => {
      setError(null);
      setGeneration((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [active, allowDirect, relayFallback, state]);

  useEffect(() => {
    setEverConnected(false);
    automaticRetries.current = 0;
    setRelayFallback(false);
  }, [active, sessionId]);

  const reconnecting =
    everConnected &&
    (state === 'reconnecting' ||
      state === 'failed' ||
      state === 'connecting' ||
      state === 'waiting');

  return { state, remoteStream, error, transport, quality, reconnecting, retry, notifyLeave };
}
