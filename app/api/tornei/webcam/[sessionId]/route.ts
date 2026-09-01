import { NextRequest, NextResponse } from 'next/server';
import {
  appendSignalingMessage,
  listSignalingMessages,
  SignalingRateLimitError,
  SignalingSessionLimitError,
  SignalingStoreUnavailableError,
} from '@/lib/webrtc/signaling-store';
import {
  decodeWebcamRelayCapability,
  isValidWebcamSessionId,
  webcamRelayCookieName,
  type WebcamRelayRole,
} from '@/lib/webrtc/webcam-relay-auth';
import { config } from '@/lib/config';
import { isSameOriginMutation } from '@/lib/security/request-origin';
import { readBoundedJson } from '@/lib/security/bounded-json';
import { privateJson } from '@/lib/security/private-json';

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

function cookieCapability(req: NextRequest): string | null {
  const token = req.cookies.get(webcamRelayCookieName())?.value ?? null;
  return token && token.length <= 2048 && !token.includes(' ') ? token : null;
}

function storeError(err: unknown): NextResponse {
  if (err instanceof SignalingRateLimitError) {
    return privateJson(
      { error: 'rate limit' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }
  if (err instanceof SignalingSessionLimitError) {
    return privateJson({ error: 'session limit' }, { status: 409 });
  }
  if (err instanceof SignalingStoreUnavailableError) {
    return privateJson({ error: 'relay unavailable' }, { status: 503 });
  }
  return privateJson({ error: 'relay unavailable' }, { status: 503 });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  if (!isSameOriginMutation(req, config.app.siteUrl)) {
    return privateJson({ error: 'cross-site request rejected' }, { status: 403 });
  }
  const { sessionId } = await ctx.params;
  if (!isValidWebcamSessionId(sessionId)) {
    return privateJson({ error: 'invalid session' }, { status: 400 });
  }
  const decoded = await readBoundedJson(req, MAX_BODY_BYTES);
  if (!decoded.ok) {
    return privateJson(
      { error: decoded.status === 413 ? 'payload too large' : 'bad json' },
      { status: decoded.status },
    );
  }
  let body: { from?: 'host' | 'guest'; kind?: string; data?: unknown };
  if (!decoded.value || typeof decoded.value !== 'object' || Array.isArray(decoded.value)) {
    return privateJson({ error: 'bad json' }, { status: 400 });
  }
  body = decoded.value as typeof body;
  if (
    (body.from !== 'host' && body.from !== 'guest') ||
    !body.kind ||
    !SIGNAL_KINDS.has(body.kind)
  ) {
    return privateJson({ error: 'missing from/kind' }, { status: 400 });
  }
  const token = cookieCapability(req);
  const capability = decodeWebcamRelayCapability(token, sessionId, body.from);
  if (!capability) {
    return privateJson({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { seq } = await appendSignalingMessage(
      `${sessionId}:${capability.relayId}`,
      body.from,
      body.kind,
      body.data ?? null,
      sessionId,
    );
    return privateJson({ ok: true, seq });
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
    return privateJson({ error: 'invalid session' }, { status: 400 });
  }
  const roleParam = req.nextUrl.searchParams.get('role');
  if (roleParam !== 'host' && roleParam !== 'guest') {
    return privateJson({ error: 'invalid role' }, { status: 400 });
  }
  const role: WebcamRelayRole = roleParam;
  const capability = decodeWebcamRelayCapability(
    cookieCapability(req),
    sessionId,
    role,
  );
  if (!capability) {
    return privateJson({ error: 'unauthorized' }, { status: 401 });
  }
  const sinceRaw = Number(req.nextUrl.searchParams.get('since') ?? '0');
  const since = Number.isSafeInteger(sinceRaw) && sinceRaw >= 0 ? sinceRaw : 0;
  try {
    const { exists, messages } = await listSignalingMessages(
      `${sessionId}:${capability.relayId}`,
      role,
      since,
      sessionId,
    );
    if (!exists) return privateJson({ exists: false, messages: [] });
    return privateJson({ exists: true, messages });
  } catch (err) {
    return storeError(err);
  }
}
