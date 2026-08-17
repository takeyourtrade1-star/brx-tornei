export type AuthBrowserOutcome = 'none' | 'session' | 'preauth';

export interface AuthProjectionContext {
  ok: boolean;
  outcome?: AuthBrowserOutcome;
}

const JWT_LIKE = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function payloadRecord(value: unknown): Record<string, unknown> {
  const root = asRecord(value);
  if (!root) return {};
  return asRecord(root.data) ?? root;
}

function publicString(value: unknown, maxLength = 2_048): string | undefined {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > maxLength ||
    CONTROL_CHARACTERS.test(value) ||
    JWT_LIKE.test(value)
  ) {
    return undefined;
  }
  return value;
}

function copyString(
  output: Record<string, unknown>,
  input: Record<string, unknown>,
  key: string,
  maxLength?: number,
): void {
  const value = publicString(input[key], maxLength);
  if (value !== undefined) output[key] = value;
}

function projectPreferences(value: unknown): Record<string, unknown> | undefined {
  const input = asRecord(value);
  if (!input) return undefined;
  const output: Record<string, unknown> = {};
  copyString(output, input, 'theme', 32);
  copyString(output, input, 'language', 16);
  copyString(output, input, 'created_at', 64);
  copyString(output, input, 'updated_at', 64);
  if (typeof input.is_onboarding_completed === 'boolean') {
    output.is_onboarding_completed = input.is_onboarding_completed;
  }
  return Object.keys(output).length > 0 ? output : undefined;
}

function projectUser(value: unknown): Record<string, unknown> {
  const input = asRecord(value) ?? {};
  const output: Record<string, unknown> = {};
  for (const key of ['id', 'email', 'username', 'name', 'account_status', 'created_at']) {
    copyString(output, input, key, key === 'email' ? 320 : 128);
  }
  if (typeof input.mfa_enabled === 'boolean') output.mfa_enabled = input.mfa_enabled;
  const preferences = projectPreferences(input.preferences);
  if (preferences) output.preferences = preferences;
  return output;
}

function projectMessageFields(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  copyString(output, input, 'detail');
  copyString(output, input, 'message');
  copyString(output, input, 'status', 128);
  return output;
}

function projectRegistration(input: Record<string, unknown>): Record<string, unknown> {
  if (input.status === 'verification_pending') {
    const output: Record<string, unknown> = { status: 'verification_pending' };
    for (const key of [
      'flow_id',
      'destination',
      'expires_at',
      'resend_available_at',
      'delivery_status',
    ]) {
      copyString(output, input, key, key === 'destination' ? 320 : 128);
    }
    return output;
  }
  return projectUser(input);
}

/**
 * Proiezione positiva dei soli DTO browser previsti. Nessuna chiave o valore
 * inatteso dell'upstream attraversa il confine BFF.
 */
export function projectAuthPayload(
  path: string,
  value: unknown,
  context: AuthProjectionContext,
): Record<string, unknown> {
  const input = payloadRecord(value);
  if (!context.ok) {
    const error = projectMessageFields(input);
    return Object.keys(error).length > 0
      ? error
      : { detail: 'Authentication request failed' };
  }

  if (path === 'login' || path === 'login/code/verify') {
    if (context.outcome === 'preauth') return { mfa_required: true };
    if (context.outcome === 'session') return { authenticated: true };
    return {};
  }
  if (path === 'refresh' || path === 'verify-mfa') {
    return context.outcome === 'session' ? { authenticated: true } : {};
  }
  if (path === 'login/code/request') {
    return projectMessageFields(input);
  }
  if (path === 'register') {
    return projectRegistration(input);
  }
  if (path === 'me') {
    return projectUser(input.user ?? input);
  }
  if (path === 'logout') {
    return { logged_out: true };
  }
  return {};
}
