import { NextRequest, NextResponse } from 'next/server';
import {
  appendSignalingMessage,
  listSignalingMessages,
  SignalingRateLimitError,
  SignalingSessionLimitError,
  SignalingStoreUnavailableError,
} from '@/lib/webrtc/signaling-store';
import {
  isValidWebcamSessionId,
  verifyWebcamRelayCapability,
  type WebcamRelayRole,
} from '@/lib/webrtc/webcam-relay-auth';

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
const MAX_BODY_BYTES = 65 * 1024;
const SIGNAL_KINDS = new Set(['offer', 'answer', 'candidate', 'bye']);

function storeError(err: unknown): NextResponse {
  if (err instanceof SignalingRateLimitError) {
    return NextResponse.json(
      { error: 'rate limit' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }
  if (err instanceof SignalingSessionLimitError) {
    return NextResponse.json({ error: 'session limit' }, { status: 409 });
  }
  if (err instanceof SignalingStoreUnavailableError) {
    return NextResponse.json({ error: 'relay unavailable' }, { status: 503 });
  }
  return NextResponse.json({ error: 'relay unavailable' }, { status: 503 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }
  let body: { from?: 'host' | 'guest'; kind?: string; data?: unknown };
  try {
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  if (!body.from || !body.kind || !SIGNAL_KINDS.has(body.kind)) {
    return NextResponse.json({ error: 'missing from/kind' }, { status: 400 });
  }
  const token = req.nextUrl.searchParams.get('token');
  if (!verifyWebcamRelayCapability(token, sessionId, body.from)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { seq } = await appendSignalingMessage(
      sessionId,
      body.from,
      body.kind,
      body.data ?? null,
    );
    return NextResponse.json({ ok: true, seq });
  } catch (err) {
    return storeError(err);
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return NextResponse.json({ error: 'invalid session' }, { status: 400 });
  }
  const roleParam = req.nextUrl.searchParams.get('role');
  if (roleParam !== 'host' && roleParam !== 'guest') {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }
  const role: WebcamRelayRole = roleParam;
  if (
    !verifyWebcamRelayCapability(
      req.nextUrl.searchParams.get('token'),
      sessionId,
      role,
    )
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sinceRaw = Number(req.nextUrl.searchParams.get('since') ?? '0');
  const since = Number.isSafeInteger(sinceRaw) && sinceRaw >= 0 ? sinceRaw : 0;
  try {
    const { exists, messages } = await listSignalingMessages(
      sessionId,
      role,
      since,
    );
    if (!exists) return NextResponse.json({ exists: false, messages: [] });
    return NextResponse.json({ exists: true, messages });
  } catch (err) {
    return storeError(err);
  }
}
