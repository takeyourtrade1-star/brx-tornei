import { NextResponse } from 'next/server';

const PRIVATE_NO_STORE = 'private, no-store, max-age=0, must-revalidate';

/** JSON response for credentials, capabilities and authenticated live state. */
export function privateJson(body: unknown, init: ResponseInit = {}): NextResponse {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE);
  return NextResponse.json(body, { ...init, headers });
}
