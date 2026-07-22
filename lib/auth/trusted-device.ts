import 'server-only';

import { cookies, headers } from 'next/headers';
import {
  buildTrustedDeviceRequestCookie,
  getTrustedDeviceAuthPolicy,
  getSetCookieHeaders,
  MFA_TRUST_COOKIE,
  parseTrustedDeviceSetCookies,
} from '@/lib/auth/trusted-device-cookie';

/** Cookie trusted-device e User-Agent originali da inoltrare all'Auth API. */
export async function getTrustedDeviceForwardHeaders(
  path: string
): Promise<Record<string, string>> {
  const policy = getTrustedDeviceAuthPolicy(path);
  const cookieStore = policy.forwardCookie ? await cookies() : null;
  const requestHeaders = policy.forwardUserAgent ? await headers() : null;
  const cookie = buildTrustedDeviceRequestCookie(
    cookieStore?.get(MFA_TRUST_COOKIE)?.value
  );
  const userAgent = requestHeaders?.get('user-agent');

  return {
    ...(cookie ? { Cookie: cookie } : {}),
    ...(userAgent ? { 'User-Agent': userAgent } : {}),
  };
}

/** Applica al browser una emissione, rotazione o revoca decisa dall'Auth API. */
export async function applyTrustedDeviceResponse(
  path: string,
  headers: Headers
): Promise<void> {
  if (!getTrustedDeviceAuthPolicy(path).acceptSetCookie) return;

  const update = parseTrustedDeviceSetCookies(getSetCookieHeaders(headers));
  if (!update) return;

  const cookieStore = await cookies();
  cookieStore.set(MFA_TRUST_COOKIE, update.value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: update.maxAge,
  });
}
