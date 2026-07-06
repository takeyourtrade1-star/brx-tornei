'use client';

/**
 * ICE servers: preferisce il Tournament Service (TURN ephemeral), fallback env.
 */

const DEFAULT_STUN = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];

let cachedServers: RTCIceServer[] | null = null;
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

/** Carica ICE servers dal proxy API con cache client-side. */
export async function fetchIceServers(): Promise<RTCIceServer[]> {
  if (cachedServers && Date.now() < cacheExpiresAt) return cachedServers;

  try {
    const res = await fetch('/api/tournaments/ice-servers', { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { ice_servers?: unknown; expires_at?: string };
      };
      const mapped = mapApiIceServers(json.data?.ice_servers);
      if (mapped) {
        cachedServers = mapped;
        if (json.data?.expires_at) {
          const exp = Date.parse(json.data.expires_at);
          cacheExpiresAt = Number.isFinite(exp) ? exp : Date.now() + 3_600_000;
        } else {
          cacheExpiresAt = Date.now() + 3_600_000;
        }
        return cachedServers;
      }
    }
  } catch {
    /* fallback env */
  }

  cachedServers = envIceServers();
  cacheExpiresAt = Date.now() + 60_000;
  return cachedServers;
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
