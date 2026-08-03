import { NextRequest, NextResponse } from 'next/server';
import {
  consumeWebcamGuestClaim,
  isValidWebcamSessionId,
  WEBCAM_RELAY_COOKIE_MAX_AGE_SECONDS,
  WEBCAM_RELAY_COOKIE_PATH,
  webcamRelayCookieName,
} from '@/lib/webrtc/webcam-relay-auth';
import { config } from '@/lib/config';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { readBoundedJson } from '@/lib/security/bounded-json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_BODY_BYTES = 512;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { sessionId } = await context.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  const decoded = await readBoundedJson(request, MAX_BODY_BYTES);
  if (!decoded.ok) {
    return NextResponse.json(
      { error: decoded.status === 413 ? 'payload too large' : 'claim invalid' },
      { status: decoded.status },
    );
  }
  const body = decoded.value;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'claim invalid' }, { status: 400 });
  }
  const claim = (body as { claim?: unknown }).claim;
  if (typeof claim !== 'string') {
    return NextResponse.json({ error: 'claim invalid' }, { status: 400 });
  }
  try {
    const token = await consumeWebcamGuestClaim(sessionId, claim);
    if (!token) return NextResponse.json({ error: 'claim invalid or used' }, { status: 401 });
    const response = NextResponse.json({ ok: true }, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
    response.cookies.set(webcamRelayCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      path: WEBCAM_RELAY_COOKIE_PATH,
      maxAge: WEBCAM_RELAY_COOKIE_MAX_AGE_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'relay unavailable' }, { status: 503 });
  }
}
