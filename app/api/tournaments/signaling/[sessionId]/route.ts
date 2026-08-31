import { NextRequest, NextResponse } from 'next/server';
import {
  handleTournamentSignalingGet,
  handleTournamentSignalingPost,
  parseSignalingPostBody,
} from '@/lib/webrtc/tournament-signaling-proxy';
import { config } from '@/lib/config';
import { isCanonicalUuid } from '@/lib/security/internal-service-headers';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Proxy signaling match P2P (autenticato server-side verso il Tournament Service). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(req, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { sessionId } = await ctx.params;
  if (!isCanonicalUuid(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  const body = await parseSignalingPostBody(req);
  if (!body.ok) {
    const error = body.status === 408
      ? 'request body timed out'
      : body.status === 413
        ? 'payload too large'
        : 'invalid signal';
    return NextResponse.json({ error }, { status: body.status });
  }
  return handleTournamentSignalingPost(sessionId, body.value);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  if (Buffer.byteLength(req.nextUrl.search, 'utf8') > 2048) {
    return NextResponse.json({ error: 'query too large' }, { status: 414 });
  }
  if (!isCanonicalUuid(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  const rawSince = req.nextUrl.searchParams.get('since') ?? '0';
  if (!/^\d{1,16}$/.test(rawSince)) {
    return NextResponse.json({ error: 'invalid since' }, { status: 400 });
  }
  const since = Number(rawSince);
  if (!Number.isSafeInteger(since)) {
    return NextResponse.json({ error: 'invalid since' }, { status: 400 });
  }
  const role = req.nextUrl.searchParams.get('role');
  if (role !== 'host' && role !== 'guest') {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }
  return handleTournamentSignalingGet(sessionId, role, since);
}
