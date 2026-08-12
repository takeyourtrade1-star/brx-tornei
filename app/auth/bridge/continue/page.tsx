import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthBridgeRefresh } from '@/components/feature/auth/auth-bridge-refresh';
import {
  BRIDGE_NONCE_COOKIE,
  isValidBridgeNonce,
} from '@/lib/auth/bridge-nonce';
import { buildLoginRedirectUrl, sanitizeRedirect } from '@/lib/auth/redirect';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export default async function AuthBridgeContinuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeRedirect(single(params.next));
  const nonce = single(params.nonce);
  const store = await cookies();
  if (
    !isValidBridgeNonce(nonce) ||
    store.get(BRIDGE_NONCE_COOKIE)?.value !== nonce ||
    !store.has(config.auth.refreshCookie)
  ) {
    redirect(`/login${buildLoginRedirectUrl(nextPath, '')}`);
  }
  return (
    <AuthBridgeRefresh
      nonce={nonce}
      nextPath={nextPath}
      loginPath={`/login${buildLoginRedirectUrl(nextPath, '')}`}
    />
  );
}
