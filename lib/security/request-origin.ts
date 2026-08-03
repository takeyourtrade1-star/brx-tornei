/** Exact Origin/Fetch-Metadata check for cookie or capability mutations. */
export function isSameOriginMutation(
  request: Request,
  expectedSiteUrl: string,
): boolean {
  let expected: string;
  let requestOrigin: string;
  try {
    expected = new URL(expectedSiteUrl).origin;
    requestOrigin = new URL(request.url).origin;
  } catch {
    return false;
  }
  if (requestOrigin !== expected) return false;
  if (request.method === 'GET' || request.method === 'HEAD') return true;

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return false;
  const origin = request.headers.get('origin');
  if (origin) {
    if (origin === 'null') return false;
    try {
      return new URL(origin).origin === expected;
    } catch {
      return false;
    }
  }
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    const parsed = new URL(referer);
    return parsed.protocol === 'https:' && parsed.origin === expected;
  } catch {
    return false;
  }
}
