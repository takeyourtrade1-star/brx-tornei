/**
 * Configurazione ICE per il link webcam telefono↔PC.
 *
 * STUN basta quando telefono e PC sono sulla stessa rete (candidati host/srflx):
 * è il caso più comune e dà la latenza più bassa, perché la connessione resta
 * diretta. Il TURN è il relay di fallback: ~10–20% degli utenti (rete mobile/
 * CGNAT, reti aziendali) non riesce a connettersi in P2P diretto. Per i tornei
 * "veri" il TURN va configurato (vedi .env.example sotto). Senza, la feature
 * funziona comunque quando i due dispositivi sono sulla stessa LAN.
 *
 * .env (NEXT_PUBLIC_* perché servono nel browser):
 *   NEXT_PUBLIC_WEBRTC_STUN_URLS=stun:stun.l.google.com:19302
 *   NEXT_PUBLIC_WEBRTC_TURN_URLS=turn:turn.ebartex.com:3478?transport=udp
 *   NEXT_PUBLIC_WEBRTC_TURN_USERNAME=...
 *   NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL=...
 */

const DEFAULT_STUN = ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'];

function splitEnv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getIceServers(): RTCIceServer[] {
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

/** true se è configurato un TURN: connessione garantita anche cross-rete. */
export function hasTurn(): boolean {
  return (
    splitEnv(process.env.NEXT_PUBLIC_WEBRTC_TURN_URLS).length > 0 &&
    Boolean(process.env.NEXT_PUBLIC_WEBRTC_TURN_USERNAME) &&
    Boolean(process.env.NEXT_PUBLIC_WEBRTC_TURN_CREDENTIAL)
  );
}
