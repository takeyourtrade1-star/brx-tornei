import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Rule = {
  method: 'GET' | 'POST';
  upstreamPath: string;
  maxBodyBytes: number;
  timeoutMs: number;
  cache: boolean;
  rateLimit: number;
  requiresInternalToken: boolean;
};

function resolveRule(method: string, parts: string[]): Rule | null {
  const path = parts.join('/');
  if (method === 'POST' && path === 'scan') {
    return { method: 'POST', upstreamPath: 'scan', maxBodyBytes: 6 * 1024 * 1024, timeoutMs: 20_000, cache: false, rateLimit: 20, requiresInternalToken: true };
  }
  if (method === 'POST' && path === 'search-vector') {
    return { method: 'POST', upstreamPath: 'search-vector', maxBodyBytes: 16 * 1024, timeoutMs: 8_000, cache: false, rateLimit: 120, requiresInternalToken: true };
  }
  if (method === 'POST' && path === 'verify') {
    return { method: 'POST', upstreamPath: 'verify', maxBodyBytes: 2 * 1024 * 1024, timeoutMs: 12_000, cache: false, rateLimit: 30, requiresInternalToken: true };
  }
  if (method === 'GET' && path === 'static/dinov2_small.onnx') {
    return { method: 'GET', upstreamPath: path, maxBodyBytes: 0, timeoutMs: 60_000, cache: true, rateLimit: 0, requiresInternalToken: true };
  }
  if (method === 'GET' && path === 'health') {
    return { method: 'GET', upstreamPath: 'health', maxBodyBytes: 0, timeoutMs: 5_000, cache: false, rateLimit: 0, requiresInternalToken: false };
  }
  if (
    method === 'GET' &&
    parts.length === 2 &&
    parts[0] === 'card' &&
    UUID_PATTERN.test(parts[1] ?? '')
  ) {
    return { method: 'GET', upstreamPath: `card/${parts[1]}`, maxBodyBytes: 0, timeoutMs: 8_000, cache: false, rateLimit: 0, requiresInternalToken: true };
  }
  return null;
}

function upstreamBase(): URL | null {
  const configured = process.env.BRX_MATCH_API_URL?.trim();
  if (!configured) return null;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

async function readCappedBody(
  req: NextRequest,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  const reader = req.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function copyResponseHeaders(upstream: Response, cache: boolean): Headers {
  const headers = new Headers();
  for (const name of ['content-type', 'content-length', 'content-disposition', 'etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set(
    'Cache-Control',
    cache ? 'public, max-age=2592000, immutable' : 'no-store',
  );
  return headers;
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const rule = resolveRule(req.method, path);
  if (!rule) {
    return NextResponse.json({ error: 'endpoint not allowed' }, { status: 404 });
  }
  const base = upstreamBase();
  if (!base) {
    return NextResponse.json({ error: 'scanner unavailable' }, { status: 503 });
  }
  const internalToken = process.env.BRX_MATCH_INTERNAL_TOKEN?.trim();
  if (rule.requiresInternalToken && (!internalToken || internalToken.length < 32)) {
    return NextResponse.json({ error: 'scanner unavailable' }, { status: 503 });
  }

  if (rule.method === 'POST') {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    try {
      await enforceServerRateLimit({
        scope: `brx-match:${rule.upstreamPath}`,
        subject: session.user.id,
        limit: rule.rateLimit,
      });
    } catch (error) {
      const status = statusForServerRateLimitError(error);
      return NextResponse.json(
        { error: status === 429 ? 'rate limit' : 'scanner unavailable' },
        {
          status,
          headers: status === 429 ? { 'Retry-After': '60' } : undefined,
        },
      );
    }
  }

  const upstream = new URL(`brx-match/${rule.upstreamPath}`, base);
  if (rule.upstreamPath === 'scan') {
    const mode = req.nextUrl.searchParams.get('mode') ?? 'auto';
    if (!['auto', 'fast', 'full'].includes(mode)) {
      return NextResponse.json({ error: 'invalid mode' }, { status: 400 });
    }
    upstream.searchParams.set('mode', mode);
  } else if (req.nextUrl.search) {
    return NextResponse.json({ error: 'query not allowed' }, { status: 400 });
  }

  let body: Uint8Array | undefined;
  if (rule.method === 'POST') {
    const capped = await readCappedBody(req, rule.maxBodyBytes);
    if (capped === null) {
      return NextResponse.json({ error: 'payload too large' }, { status: 413 });
    }
    body = capped;
  }

  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (rule.requiresInternalToken && internalToken) {
      headers.set('X-Internal-Token', internalToken);
    }
    const contentType = req.headers.get('content-type');
    if (contentType && rule.method === 'POST') headers.set('Content-Type', contentType);
    const response = await fetch(upstream, {
      method: rule.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(rule.timeoutMs),
    });
    return new NextResponse(response.body, {
      status: response.status,
      headers: copyResponseHeaders(response, rule.cache),
    });
  } catch {
    return NextResponse.json({ error: 'scanner unavailable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
