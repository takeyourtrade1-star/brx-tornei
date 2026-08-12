import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  BRIDGE_NONCE_COOKIE,
  BRIDGE_NONCE_PATTERN,
} from '@/lib/auth/bridge-nonce';
import { config } from '@/lib/config';
import { readBoundedJson, isJsonContentType } from '@/lib/security/bounded-json';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ nonce: z.string().regex(BRIDGE_NONCE_PATTERN) }).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOriginMutation(request, config.app.siteUrl)) {
    return NextResponse.json({ error: 'cross-site request rejected' }, { status: 403 });
  }
  if (!isJsonContentType(request.headers.get('content-type'))) {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }
  const decoded = await readBoundedJson(request, 256);
  const parsed = decoded.ok ? bodySchema.safeParse(decoded.value) : null;
  if (!parsed?.success) {
    return NextResponse.json(
      { error: 'invalid request' },
      { status: decoded.ok ? 400 : decoded.status },
    );
  }
  const cookieNonce = request.cookies.get(BRIDGE_NONCE_COOKIE)?.value;
  if (
    parsed.data.nonce !== cookieNonce ||
    !request.cookies.has(config.auth.refreshCookie)
  ) {
    return NextResponse.json({ error: 'bridge expired' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' },
  });
  response.cookies.set(BRIDGE_NONCE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
