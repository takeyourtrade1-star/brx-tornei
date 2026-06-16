import { NextRequest, NextResponse } from 'next/server';
import {
  appendSignalingMessage,
  listSignalingMessages,
} from '@/lib/webrtc/signaling-store';

/**
 * Relay di signaling per il link webcam telefono↔PC (offer/answer + ICE).
 *
 * Lo store è in-memory in dev; in produzione multi-istanza usa Upstash Redis
 * se `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` sono configurati.
 * Questo handler NON tocca il media: instrada solo i messaggi di setup, poi il
 * video va P2P.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  let body: { from?: 'host' | 'guest'; kind?: string; data?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (!body.from || !body.kind) {
    return NextResponse.json({ error: 'missing from/kind' }, { status: 400 });
  }

  const { seq } = await appendSignalingMessage(
    sessionId,
    body.from,
    body.kind,
    body.data ?? null,
  );
  return NextResponse.json({ ok: true, seq });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  const since = Number(req.nextUrl.searchParams.get('since') ?? '0') || 0;
  const { exists, messages } = await listSignalingMessages(sessionId, since);
  if (!exists) return NextResponse.json({ exists: false, messages: [] });
  return NextResponse.json({ exists: true, messages });
}
