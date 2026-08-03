const INTERNAL_CALLER_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Accept only the lowercase RFC 9562 textual form, including UUIDv7/v8. */
export function isCanonicalUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

interface InternalServiceHeadersInput {
  requiresInternalToken: boolean;
  internalToken?: string;
  internalCaller?: string;
  rateSubject?: string;
  accept?: string;
}

/** Build service-auth headers without ever copying inbound proxy headers. */
export function buildInternalServiceHeaders({
  requiresInternalToken,
  internalToken,
  internalCaller,
  rateSubject,
  accept = 'application/json',
}: InternalServiceHeadersInput): Headers {
  const headers = new Headers({
    Accept: accept,
    'Accept-Encoding': 'identity',
  });
  if (
    !requiresInternalToken ||
    !internalToken ||
    internalToken.length < 32 ||
    !internalCaller ||
    !INTERNAL_CALLER_PATTERN.test(internalCaller)
  ) {
    return headers;
  }
  headers.set('X-Internal-Token', internalToken);
  headers.set('X-Internal-Caller', internalCaller);
  if (rateSubject && isCanonicalUuid(rateSubject)) {
    headers.set('X-Internal-Rate-Subject', rateSubject);
  }
  return headers;
}
