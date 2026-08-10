import 'server-only';

import { isIP } from 'node:net';

const TRUSTED_SINGLE_VALUE_HEADERS = new Set([
  'cloudfront-viewer-address',
  'cf-connecting-ip',
  'x-vercel-forwarded-for',
]);

function normalizeIp(raw: string | null): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end <= 1) return null;
    const suffix = value.slice(end + 1);
    if (suffix && !/^:\d{1,5}$/.test(suffix)) return null;
    value = value.slice(1, end);
  } else {
    const ipv4WithPort = value.match(/^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/);
    if (ipv4WithPort) value = ipv4WithPort[1];
  }
  if (value.length > 64 || isIP(value) === 0) return null;
  if (isIP(value) === 4) return value;
  try {
    return new URL(`http://[${value}]/`).hostname.slice(1, -1).toLowerCase();
  } catch {
    return null;
  }
}

function trustedProxyHops(): number | null {
  const raw = process.env.TRUSTED_PROXY_HOPS?.trim();
  if (!raw) return 1;
  if (!/^[1-9]\d?$/.test(raw)) return null;
  const parsed = Number(raw);
  return parsed <= 10 ? parsed : null;
}

/**
 * Deriva il soggetto del rate limit solo da header dell'infrastruttura
 * esplicitamente ammessi. Su Amplify/CloudFront il valore affidabile di XFF è
 * quello aggiunto al margine destro; valori client anteposti non cambiano il
 * bucket. In assenza di un indirizzo valido si usa un bucket globale chiuso.
 */
export function getRateLimitClientIpFromHeaders(headers: Pick<Headers, 'get'>): string {
  const configured = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (configured) {
    if (!TRUSTED_SINGLE_VALUE_HEADERS.has(configured)) return 'unknown';
    return normalizeIp(headers.get(configured)) ?? 'unknown';
  }

  const proxyHops = trustedProxyHops();
  if (proxyHops === null) return 'unknown';
  const chain = headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!chain || chain.length < proxyHops) return 'unknown';
  return normalizeIp(chain[chain.length - proxyHops]) ?? 'unknown';
}

export function getRateLimitClientIp(request: Request): string {
  return getRateLimitClientIpFromHeaders(request.headers);
}
