import { NextRequest, NextResponse } from 'next/server';

/**
 * Relay di signaling per il link webcam telefono↔PC (offer/answer + ICE).
 *
 * Store IN-MEMORY: funziona in `next dev` e su una singola istanza server.
 * In PRODUZIONE multi-istanza (Amplify/Lambda) lo stato in memoria NON è
 * condiviso tra le istanze: va sostituito con uno store condiviso
 * (Redis/Upstash) oppure con un endpoint del backend FastAPI, mantenendo
 * la stessa shape di richiesta/risposta. Questo handler NON tocca il media:
 * instrada solo i messaggi di setup, poi il video va P2P.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Msg {
  seq: number;
  from: 'host' | 'guest';
  kind: string;
  data: unknown;
}
interface Session {
  seq: number;
  messages: Msg[];
  createdAt: number;
}

const SESSION_TTL_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 300;

// Su globalThis per sopravvivere all'hot-reload in dev.
const store: Map<string, Session> =
  (globalThis as unknown as { __webcamSig?: Map<string, Session> }).__webcamSig ??
  new Map<string, Session>();
(globalThis as unknown as { __webcamSig?: Map<string, Session> }).__webcamSig = store;

function gc(): void {
  const now = Date.now();
  for (const [id, s] of store) {
    if (now - s.createdAt > SESSION_TTL_MS) store.delete(id);
  }
}

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

  gc();
  let s = store.get(sessionId);
  if (!s) {
    s = { seq: 0, messages: [], createdAt: Date.now() };
    store.set(sessionId, s);
  }
  s.seq += 1;
  s.messages.push({ seq: s.seq, from: body.from, kind: body.kind, data: body.data ?? null });
  if (s.messages.length > MAX_MESSAGES) {
    s.messages.splice(0, s.messages.length - MAX_MESSAGES);
  }
  return NextResponse.json({ ok: true, seq: s.seq });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const { sessionId } = await ctx.params;
  const since = Number(req.nextUrl.searchParams.get('since') ?? '0') || 0;
  const s = store.get(sessionId);
  if (!s) return NextResponse.json({ exists: false, messages: [] });
  const messages = s.messages.filter((m) => m.seq > since);
  return NextResponse.json({ exists: true, messages });
}
