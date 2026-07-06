import { NextRequest, NextResponse } from 'next/server';
import {
  handleTournamentSignalingGet,
  handleTournamentSignalingPost,
  parseSignalingPostBody,
} from '@/lib/webrtc/tournament-signaling-proxy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Proxy signaling match P2P (autenticato server-side verso il Tournament Service). */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  const body = await parseSignalingPostBody(req);
  return handleTournamentSignalingPost(sessionId, body);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  const since = Number(req.nextUrl.searchParams.get('since') ?? '0') || 0;
  const role = req.nextUrl.searchParams.get('role') ?? 'host';
  return handleTournamentSignalingGet(sessionId, role, since);
}
