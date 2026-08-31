import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getSession } from '@/lib/auth/session';
import {
  enforceServerRateLimit,
  statusForServerRateLimitError,
} from '@/lib/security/server-rate-limit';
import { readBoundedResponseJson } from '@/lib/security/bounded-response';
import { readBoundedBytes } from '@/lib/security/bounded-json';
import {
  buildInternalServiceHeaders,
  isCanonicalUuid,
} from '@/lib/security/internal-service-headers';
import {
  isAllowedOnnxMediaType,
  pinnedEdgeModelSha256,
} from '@/lib/security/onnx-response';
import { isSameOriginMutation } from '@/lib/security/request-origin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CAPABILITIES_BYTES = 64 * 1024;
const MAX_ONNX_MODEL_BYTES = 96 * 1024 * 1024;
const REQUEST_BODY_TIMEOUT_MS = 10_000;

type Rule = {
  method: 'GET' | 'POST';
  upstreamPath: string;
  maxBodyBytes: number;
  maxResponseBytes: number;
  timeoutMs: number;
  responseKind: 'json' | 'model';
  rateLimit: number;
  requiresSession: boolean;
  requiresInternalToken: boolean;
};

function resolveRule(method: string, parts: string[]): Rule | null {
  const path = parts.join('/');
  if (method === 'POST' && path === 'scan') {
    return { method: 'POST', upstreamPath: 'scan', maxBodyBytes: 6 * 1024 * 1024, maxResponseBytes: 4 * 1024 * 1024, timeoutMs: 20_000, responseKind: 'json', rateLimit: 20, requiresSession: true, requiresInternalToken: true };
  }
  if (method === 'POST' && path === 'search-vector') {
    return { method: 'POST', upstreamPath: 'search-vector', maxBodyBytes: 16 * 1024, maxResponseBytes: 4 * 1024 * 1024, timeoutMs: 8_000, responseKind: 'json', rateLimit: 120, requiresSession: true, requiresInternalToken: true };
  }
  if (method === 'POST' && path === 'verify') {
    return { method: 'POST', upstreamPath: 'verify', maxBodyBytes: 2 * 1024 * 1024, maxResponseBytes: 1024 * 1024, timeoutMs: 12_000, responseKind: 'json', rateLimit: 30, requiresSession: true, requiresInternalToken: true };
  }
  if (method === 'GET' && path === 'static/dinov2_small.onnx') {
    return { method: 'GET', upstreamPath: path, maxBodyBytes: 0, maxResponseBytes: MAX_ONNX_MODEL_BYTES, timeoutMs: 60_000, responseKind: 'model', rateLimit: 3, requiresSession: true, requiresInternalToken: true };
  }
  if (method === 'GET' && path === 'capabilities') {
    return { method: 'GET', upstreamPath: 'capabilities', maxBodyBytes: 0, maxResponseBytes: MAX_CAPABILITIES_BYTES, timeoutMs: 8_000, responseKind: 'json', rateLimit: 60, requiresSession: true, requiresInternalToken: true };
  }
  if (method === 'GET' && path === 'health') {
    return { method: 'GET', upstreamPath: 'health', maxBodyBytes: 0, maxResponseBytes: 16 * 1024, timeoutMs: 5_000, responseKind: 'json', rateLimit: 120, requiresSession: false, requiresInternalToken: true };
  }
  if (
    method === 'GET' &&
    parts.length === 2 &&
    parts[0] === 'card' &&
    isCanonicalUuid(parts[1] ?? '')
  ) {
    return { method: 'GET', upstreamPath: `card/${parts[1]}`, maxBodyBytes: 0, maxResponseBytes: 512 * 1024, timeoutMs: 8_000, responseKind: 'json', rateLimit: 120, requiresSession: true, requiresInternalToken: true };
  }
  return null;
}

function parseBareOrigin(raw: string | undefined): URL | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      (value !== url.origin && value !== `${url.origin}/`)
    ) return null;
    return url;
  } catch {
    return null;
  }
}

function isPrivateDevelopmentHostname(hostname: string): boolean {
  const value = hostname.toLowerCase();
  return (
    value === 'localhost' ||
    value === '127.0.0.1' ||
    value === '[::1]' ||
    value.endsWith('.internal') ||
    value.endsWith('.local') ||
    /^10\./.test(value) ||
    /^192\.168\./.test(value) ||
    /^172\.(?:1[6-9]|2\d|3[01])\./.test(value)
  );
}

function upstreamBase(): URL | null {
  const configured = parseBareOrigin(process.env.BRX_MATCH_API_URL);
  if (!configured) return null;
  const allowed = parseBareOrigin(process.env.BRX_MATCH_ALLOWED_ORIGIN);

  if (process.env.NODE_ENV === 'production') {
    if (
      configured.protocol !== 'https:' ||
      !allowed ||
      allowed.protocol !== 'https:' ||
      configured.origin !== allowed.origin
    ) return null;
    return configured;
  }

  if (
    isPrivateDevelopmentHostname(configured.hostname) &&
    (configured.protocol === 'http:' || configured.protocol === 'https:')
  ) return configured;
  if (
    configured.protocol === 'https:' &&
    allowed?.protocol === 'https:' &&
    configured.origin === allowed.origin
  ) return configured;
  return null;
}

interface EdgeModelDescriptor {
  size: number;
  sha256: string;
}

interface CapabilitiesPayload {
  status: string;
  pipeline_version: string;
  model_loaded: boolean;
  index_ready: boolean;
  edge_model: EdgeModelDescriptor;
}

function normalizeCapabilities(payload: unknown): CapabilitiesPayload {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('invalid capabilities');
  }
  const value = payload as Record<string, unknown>;
  const edge = value.edge_model;
  if (!edge || typeof edge !== 'object' || Array.isArray(edge)) {
    throw new Error('invalid edge model');
  }
  const descriptor = edge as Record<string, unknown>;
  if (
    typeof value.status !== 'string' ||
    value.status.length < 1 ||
    value.status.length > 64 ||
    typeof value.pipeline_version !== 'string' ||
    value.pipeline_version.length < 1 ||
    value.pipeline_version.length > 128 ||
    typeof value.model_loaded !== 'boolean' ||
    typeof value.index_ready !== 'boolean' ||
    !Number.isSafeInteger(descriptor.size) ||
    Number(descriptor.size) <= 100_000 ||
    Number(descriptor.size) > MAX_ONNX_MODEL_BYTES ||
    typeof descriptor.sha256 !== 'string' ||
    !/^[0-9a-f]{64}$/.test(descriptor.sha256)
  ) {
    throw new Error('invalid capabilities');
  }
  const pinnedSha256 = pinnedEdgeModelSha256();
  if (pinnedSha256 && descriptor.sha256 !== pinnedSha256) {
    throw new Error('edge model digest mismatch');
  }
  return {
    status: value.status,
    pipeline_version: value.pipeline_version,
    model_loaded: value.model_loaded,
    index_ready: value.index_ready,
    edge_model: {
      size: Number(descriptor.size),
      sha256: descriptor.sha256,
    },
  };
}

async function fetchEdgeModelDescriptor(
  base: URL,
  headers: Headers,
): Promise<EdgeModelDescriptor> {
  const response = await fetch(new URL('brx-match/capabilities', base), {
    method: 'GET',
    headers,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error('capabilities unavailable');
  }
  const payload = normalizeCapabilities(
    await readBoundedResponseJson(response, MAX_CAPABILITIES_BYTES),
  );
  return payload.edge_model;
}

function exactLengthModelStream(
  body: ReadableStream<Uint8Array>,
  expectedBytes: number,
): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  let received = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (received !== expectedBytes) {
            controller.error(new Error('model size mismatch'));
          } else {
            controller.close();
          }
          return;
        }
        received += value.byteLength;
        if (received > expectedBytes) {
          await reader.cancel('model exceeds manifest size').catch(() => undefined);
          controller.error(new Error('model exceeds manifest size'));
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason).catch(() => undefined);
    },
  });
}

async function modelResponse(
  upstream: Response,
  descriptor: EdgeModelDescriptor,
): Promise<NextResponse> {
  const encoding = upstream.headers.get('content-encoding')?.trim().toLowerCase();
  const declared = upstream.headers.get('content-length');
  const contentType = upstream.headers.get('content-type');
  if (
    upstream.status !== 200 ||
    (encoding && encoding !== 'identity') ||
    !isAllowedOnnxMediaType(contentType) ||
    (declared !== null &&
      (!/^\d+$/.test(declared) || Number(declared) !== descriptor.size)) ||
    !upstream.body
  ) {
    await upstream.body?.cancel().catch(() => undefined);
    throw new Error('invalid model response');
  }
  const headers = new Headers({
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(descriptor.size),
    'Content-Encoding': 'identity',
    'Content-Disposition': 'attachment; filename="dinov2_small.onnx"',
    'Cache-Control': 'private, max-age=86400, immutable',
    'Cross-Origin-Resource-Policy': 'same-origin',
    ETag: `"sha256-${descriptor.sha256}"`,
    'X-Content-Type-Options': 'nosniff',
  });
  return new NextResponse(
    exactLengthModelStream(upstream.body, descriptor.size),
    { status: 200, headers },
  );
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  if (req.method === 'POST' && !isSameOriginMutation(req, config.app.siteUrl)) {
    return NextResponse.json(
      { error: 'cross-site request rejected' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
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
  const internalCaller = process.env.BRX_MATCH_INTERNAL_CALLER?.trim();
  if (
    rule.requiresInternalToken &&
    (!internalToken ||
      internalToken.length < 32 ||
      !internalCaller ||
      !/^[a-z0-9][a-z0-9._-]{1,63}$/.test(internalCaller))
  ) {
    return NextResponse.json({ error: 'scanner unavailable' }, { status: 503 });
  }

  let rateSubject: string | undefined;
  if (rule.requiresSession) {
    const session = await getSession();
    if (!session || !isCanonicalUuid(session.user.id)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    rateSubject = session.user.id;
    try {
      if (rule.rateLimit <= 0) throw new Error('invalid rate policy');
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
  } else if (rule.upstreamPath === 'health') {
    try {
      await enforceServerRateLimit({
        scope: 'brx-match:health',
        subject: 'global-anonymous-health',
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
    const capped = await readBoundedBytes(req, rule.maxBodyBytes, {
      timeoutMs: REQUEST_BODY_TIMEOUT_MS,
      maxChunks: 1024,
    });
    if (!capped.ok) {
      const error = capped.status === 408
        ? 'request body timed out'
        : capped.status === 413
          ? 'payload too large'
          : 'invalid request body';
      return NextResponse.json(
        { error },
        {
          status: capped.status,
          headers: { 'Cache-Control': 'private, no-store' },
        },
      );
    }
    body = capped.value;
  }

  try {
    const headers = buildInternalServiceHeaders({
      requiresInternalToken: rule.requiresInternalToken,
      internalToken,
      internalCaller,
      rateSubject,
      accept:
        rule.responseKind === 'model'
          ? 'application/octet-stream'
          : 'application/json',
    });
    const contentType = req.headers.get('content-type');
    if (contentType && rule.method === 'POST') headers.set('Content-Type', contentType);
    const modelDescriptor = rule.responseKind === 'model'
      ? await fetchEdgeModelDescriptor(
          base,
          buildInternalServiceHeaders({
            requiresInternalToken: true,
            internalToken,
            internalCaller,
            rateSubject,
          }),
        )
      : null;
    const response = await fetch(upstream, {
      method: rule.method,
      headers,
      body: body ? Buffer.from(body) : undefined,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(rule.timeoutMs),
    });
    if (rule.responseKind === 'model' && modelDescriptor) {
      return await modelResponse(response, modelDescriptor);
    }
    const payload = await readBoundedResponseJson(response, rule.maxResponseBytes);
    const safePayload = rule.upstreamPath === 'capabilities'
      ? normalizeCapabilities(payload)
      : rule.upstreamPath === 'health'
        ? {
            status:
              payload &&
              typeof payload === 'object' &&
              !Array.isArray(payload) &&
              typeof (payload as Record<string, unknown>).status === 'string'
                ? String((payload as Record<string, unknown>).status).slice(0, 64)
                : 'unavailable',
          }
        : payload;
    return NextResponse.json(safePayload, {
      status: response.status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'scanner unavailable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
