import { NextRequest, NextResponse } from 'next/server';
import {
  handleTournamentSignalingGet,
  handleTournamentSignalingPost,
  parseSignalingPostBody,
} from '@/lib/webrtc/tournament-signaling-proxy';
import { config } from '@/lib/config';
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
  const body = await parseSignalingPostBody(req);
  if (body.tooLarge) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }
  return handleTournamentSignalingPost(sessionId, body);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  if (Buffer.byteLength(req.nextUrl.search, 'utf8') > 2048) {
    return NextResponse.json({ error: 'query too large' }, { status: 414 });
  }
  const rawSince = Number(req.nextUrl.searchParams.get('since') ?? '0');
  const since = Number.isSafeInteger(rawSince) && rawSince >= 0 ? rawSince : 0;
  const role = req.nextUrl.searchParams.get('role') ?? 'host';
  return handleTournamentSignalingGet(sessionId, role, since);
}
