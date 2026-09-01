import { NextResponse } from 'next/server';
import { getAccessToken, getSession } from '@/lib/auth/session';
import { config } from '@/lib/config';
import {
  isValidWebcamSessionId,
  issueWebcamRelayGrant,
  WEBCAM_RELAY_COOKIE_MAX_AGE_SECONDS,
  WEBCAM_RELAY_COOKIE_PATH,
  webcamRelayCookieName,
} from '@/lib/webrtc/webcam-relay-auth';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { getRateLimitClientIp } from '@/lib/security/client-ip';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Mint relay grants only after backend-authoritative membership/state checks. */
export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { sessionId } = await context.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  try {
    await enforceServerRateLimit({
      scope: 'webcam-authorize:ip',
      subject: getRateLimitClientIp(request),
      limit: 20,
      requireDistributedStore: true,
    });
  } catch (error) {
    const status = statusForServerRateLimitError(error);
    return NextResponse.json(
      { error: status === 429 ? 'rate limit' : 'webcam relay unavailable' },
      {
        status,
        headers: {
          'Cache-Control': 'private, no-store',
          ...(status === 429 ? { 'Retry-After': '60' } : {}),
        },
      },
    );
  }
  const accessToken = await getAccessToken();
  if (!accessToken) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    await Promise.all([
      enforceServerRateLimit({
        scope: 'webcam-authorize:user',
        subject: session.user.id,
        limit: 12,
        windowSeconds: 600,
        requireDistributedStore: true,
      }),
      enforceServerRateLimit({
        scope: 'webcam-authorize:user-session',
        subject: `${session.user.id}:${sessionId}`,
        limit: 6,
        windowSeconds: 600,
        requireDistributedStore: true,
      }),
    ]);
  } catch (error) {
    const status = statusForServerRateLimitError(error);
    return NextResponse.json(
      { error: status === 429 ? 'rate limit' : 'webcam relay unavailable' },
      {
        status,
        headers: {
          'Cache-Control': 'private, no-store',
          ...(status === 429 ? { 'Retry-After': '600' } : {}),
        },
      },
    );
  }
  if (!config.api.tournamentsBaseURL) {
    return NextResponse.json({ error: 'webcam authorization unavailable' }, { status: 503 });
  }
  try {
    const url = new URL(
      `/api/v1/signaling/${encodeURIComponent(sessionId)}/authorize`,
      config.api.tournamentsBaseURL,
    );
    const authorization = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(config.api.timeout),
    });
    if (!authorization.ok) {
      return NextResponse.json(
        { error: authorization.status === 404 ? 'session not found' : 'forbidden' },
        { status: authorization.status },
      );
    }
    const grant = await issueWebcamRelayGrant(sessionId);
    if (!grant) throw new Error('grant unavailable');
    const response = NextResponse.json({ guestClaim: grant.guestClaim }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
    response.cookies.set(webcamRelayCookieName(), grant.hostToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: WEBCAM_RELAY_COOKIE_PATH,
      maxAge: WEBCAM_RELAY_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'webcam relay unavailable' }, { status: 503 });
  }
}
