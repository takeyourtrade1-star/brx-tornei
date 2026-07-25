import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  isValidWebcamSessionId,
  issueWebcamRelayCapability,
} from '@/lib/webrtc/webcam-relay-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Mints short-lived capabilities after validating the logged-in PC session. */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  if (!(await getSession())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const hostToken = issueWebcamRelayCapability(sessionId, 'host');
  const guestToken = issueWebcamRelayCapability(sessionId, 'guest');
  if (!hostToken || !guestToken) {
    return NextResponse.json(
      { error: 'webcam relay unavailable' },
      { status: 503 },
    );
  }
  return NextResponse.json(
    { hostToken, guestToken },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
