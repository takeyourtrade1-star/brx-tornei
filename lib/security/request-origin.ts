import { isCanonicalRequestHost } from '@/lib/security/canonical-origin';

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/** Exact Origin/Fetch-Metadata check for cookie or capability mutations. */
export function isSameOriginMutation(
  request: Request,
  expectedSiteUrl: string,
): boolean {
  let expected: URL;
  try {
    expected = new URL(expectedSiteUrl);
  } catch {
    return false;
  }
  // L'header Host è l'unico dato fedele dietro la CDN che termina il TLS
  // (l'URL interno ha protocollo http e host dell'istanza); in sua assenza si
  // ripiega sull'host dell'URL. Fail-closed su host avvelenati o mancanti.
  // Origin e Referer qui sotto arrivano dal browser e restano verificati
  // sull'origin https esatto.
  const requestHost = request.headers.get('host') ?? hostOf(request.url);
  if (!isCanonicalRequestHost(requestHost, expectedSiteUrl)) return false;
  if (request.method === 'GET' || request.method === 'HEAD') return true;

  const expectedOrigin = expected.origin;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return false;
  const origin = request.headers.get('origin');
  if (origin) {
    if (origin === 'null') return false;
    try {
      return new URL(origin).origin === expectedOrigin;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    const parsed = new URL(referer);
    return parsed.protocol === 'https:' && parsed.origin === expectedOrigin;
  } catch {
    return false;
  }
}
