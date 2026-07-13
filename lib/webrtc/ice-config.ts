'use client';

/**
 * ICE servers: preferisce il Tournament Service (TURN ephemeral), fallback env.
 */

const DEFAULT_STUN = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];

export interface IceConfig {
  iceServers: RTCIceServer[];
  /**
   * true = il backend impone il relay TURN (iceTransportPolicy 'relay'): gli IP
   * dei peer restano nascosti. false solo per tornei "Giochi con un amico?".
   * In dubbio (fallback env, errore rete) si resta su 'relay' se un TURN esiste.
   */
  forceRelay: boolean;
}

let cachedServers: RTCIceServer[] | null = null;
let cachedForceRelay = true;
let cachedSessionId: string | null = null;
let cachedAllowDirect = false;
let cacheExpiresAt = 0;

function splitEnv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function envIceServers(): RTCIceServer[] {
  const stun = splitEnv(process.env.NEXT_PUBLIC_WEBRTC_STUN_URLS);
  const servers: RTCIceServer[] = [{ urls: stun.length ? stun : DEFAULT_STUN }];
  const turnUrls = splitEnv(process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS);
  const turnUser = process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME;
  const turnCred = process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL;
  if (turnUrls.length && turnUser && turnCred) {
    servers.push({ urls: turnUrls, username: turnUser, credential: turnCred });
  }
  return servers;
}

function mapApiIceServers(raw: unknown): RTCIceServer[] | null {
  if (!Array.isArray(raw)) return null;
  const servers: RTCIceServer[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const urls = o.urls;
    if (typeof urls !== 'string' && !Array.isArray(urls)) continue;
    servers.push({
      urls,
      username: typeof o.username === 'string' ? o.username : undefined,
      credential: typeof o.credential === 'string' ? o.credential : undefined,
    });
  }
  return servers.length ? servers : null;
}

/** Sincrono — solo env (legacy webcam link). */
export function getIceServers(): RTCIceServer[] {
  return cachedServers ?? envIceServers();
}

/**
 * Carica ICE servers + politica relay dal proxy API con cache client-side.
 * `sessionId` (webcam_session_id del match/torneo) permette al backend di
 * risolvere il flag with_friend: senza sessionId il backend impone il relay.
 */
export async function fetchIceConfig(
  sessionId?: string,
  allowDirect = false,
): Promise<IceConfig> {
  if (
    cachedServers &&
    cachedSessionId === (sessionId ?? null) &&
    cachedAllowDirect === allowDirect &&
    Date.now() < cacheExpiresAt
  ) {
    return { iceServers: cachedServers, forceRelay: cachedForceRelay };
  }

  try {
    const url = new URL('/api/tournaments/ice-servers', window.location.origin);
    if (sessionId) url.searchParams.set('session_id', sessionId);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { ice_servers?: unknown; expires_at?: string; force_relay?: boolean };
      };
      const mapped = mapApiIceServers(json.data?.ice_servers);
      if (mapped) {
        cachedServers = mapped;
        // Il client applica la scelta privacy anche se il backend degrada per
        // assenza TURN: senza consenso esplicito il collegamento fallisce chiuso.
        cachedForceRelay = allowDirect ? json.data?.force_relay !== false : true;
        cachedSessionId = sessionId ?? null;
        cachedAllowDirect = allowDirect;
        if (json.data?.expires_at) {
          const exp = Date.parse(json.data.expires_at);
          cacheExpiresAt = Number.isFinite(exp) ? exp : Date.now() + 3_600_000;
        } else {
          cacheExpiresAt = Date.now() + 3_600_000;
        }
        return { iceServers: cachedServers, forceRelay: cachedForceRelay };
      }
    }
  } catch {
    /* fallback env */
  }

  cachedServers = envIceServers();
  cachedForceRelay = !allowDirect;
  cachedSessionId = sessionId ?? null;
  cachedAllowDirect = allowDirect;
  cacheExpiresAt = Date.now() + 60_000;
  return { iceServers: cachedServers, forceRelay: cachedForceRelay };
}

/** Compat: solo la lista server (usare fetchIceConfig per la politica relay). */
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  return (await fetchIceConfig()).iceServers;
}

/** true se è configurato un TURN: connessione garantita anche cross-rete. */
export function hasTurn(): boolean {
  const servers = cachedServers ?? envIceServers();
  return servers.some((s) => {
    const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
    return urls.some((u) => String(u).startsWith('turn'));
  });
}

export function matchSignalingBase(sessionId: string): string {
  return `/api/tournaments/signaling/${encodeURIComponent(sessionId)}`;
}
