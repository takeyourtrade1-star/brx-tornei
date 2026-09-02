import 'server-only';

import { headers } from 'next/headers';
import { config } from '@/lib/config';

/**
 * Header con cui dichiariamo al Tournament Service che siamo il suo frontend
 * di prima parte.
 *
 * Ogni lettura RSC e ogni Server Action escono dall'IP del server, non da
 * quello del giocatore: senza questi header il backend conta tutta l'utenza in
 * un'unica quota per-indirizzo, e il sito si autolimita appena qualche persona
 * è online contemporaneamente. Il token prova chi siamo, l'IP dice per conto
 * di chi stiamo chiamando.
 */

export const SERVICE_TOKEN_HEADER = 'X-Ebartex-Service-Token';
export const CLIENT_IP_HEADER = 'X-Ebartex-Client-IP';

const MAX_FORWARDED_HOPS = 32;
const MAX_IP_LENGTH = 64;

/** Solo un IP pubblico identifica un giocatore: il resto non è inoltrabile. */
export function isForwardableClientIp(value: string): boolean {
  const candidate = value.trim();
  if (!candidate || candidate.length > MAX_IP_LENGTH) return false;

  // IPv6 (incluso il mapped IPv4 ::ffff:a.b.c.d, che va normalizzato a monte).
  if (candidate.includes(':')) {
    if (!/^[0-9a-fA-F:.]+$/.test(candidate)) return false;
    const lowered = candidate.toLowerCase();
    if (lowered === '::' || lowered === '::1') return false;
    // Unique-local (fc00::/7) e link-local (fe80::/10).
    if (/^f[cd][0-9a-f]{2}:/.test(lowered) || /^fe[89ab][0-9a-f]:/.test(lowered)) {
      return false;
    }
    return true;
  }

  const octets = candidate.split('.');
  if (octets.length !== 4) return false;
  const numbers: number[] = [];
  for (const octet of octets) {
    if (!/^(?:0|[1-9]\d{0,2})$/.test(octet)) return false;
    const value = Number(octet);
    if (value > 255) return false;
    numbers.push(value);
  }
  const [a, b] = numbers as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  // Shared address space (CGNAT): non è l'indirizzo pubblico del giocatore.
  if (a === 100 && b >= 64 && b <= 127) return false;
  return true;
}

/** Normalizza l'IPv4 mappato in IPv6, che i proxy scrivono a volte così. */
function normalizeCandidate(value: string): string {
  const trimmed = value.trim().replace(/^\[|\]$/g, '');
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(trimmed);
  return mapped ? mapped[1]! : trimmed;
}

/**
 * IP del giocatore dalla catena inoltrata dal proxy di hosting. Si prende il
 * primo valore pubblico da sinistra: gli hop successivi sono infrastruttura.
 */
export function pickClientIp(forwardedFor: string | null, realIp: string | null): string {
  const chain = (forwardedFor ?? '').split(',').slice(0, MAX_FORWARDED_HOPS);
  for (const hop of chain) {
    const candidate = normalizeCandidate(hop);
    if (isForwardableClientIp(candidate)) return candidate;
  }
  const direct = normalizeCandidate(realIp ?? '');
  return isForwardableClientIp(direct) ? direct : '';
}

/**
 * Header di prima parte per una chiamata al Tournament Service. Vuoto se il
 * token non è configurato: il backend resta sul comportamento precedente.
 */
export async function firstPartyHeaders(): Promise<Record<string, string>> {
  const token = config.api.tournamentsServiceToken;
  if (!token) return {};

  const result: Record<string, string> = { [SERVICE_TOKEN_HEADER]: token };
  try {
    const requestHeaders = await headers();
    const clientIp = pickClientIp(
      requestHeaders.get('x-forwarded-for'),
      requestHeaders.get('x-real-ip'),
    );
    if (clientIp) result[CLIENT_IP_HEADER] = clientIp;
  } catch {
    // Fuori da uno scope di request (job, avvio): il backend userà il tetto
    // aggregato di servizio, che è esattamente il fallback previsto.
  }
  return result;
}
