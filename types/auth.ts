/** Utente minimo restituito da GET /api/auth/me (FastAPI Ebartex). */
export interface SessionUser {
  id: string;
  email: string;
  /** Il backend può esporre `username` senza `name`. */
  name: string | null;
}

export interface Session {
  user: SessionUser;
  accessToken: string;
}

/** Risposta token del backend auth (login / refresh / verify-mfa). */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/** Risposta login quando è richiesta MFA. */
export interface PreAuthTokenResponse {
  mfa_required: true;
  pre_auth_token: string;
}

/** Stato restituito dalle server action di auth ai form client. */
export interface AuthActionState {
  error?: string;
  mfaRequired?: boolean;
}
