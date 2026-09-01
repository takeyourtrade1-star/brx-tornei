/** Utente minimo restituito da GET /api/auth/me (FastAPI Ebartex). */
export interface SessionUser {
  id: string;
  email: string;
  /** Username canonico dell'account sul marketplace Ebartex. */
  username: string | null;
  /** Nome visualizzato; non va usato come username Ebartex. */
  name: string | null;
}

export interface Session {
  user: SessionUser;
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
  success?: boolean;
}
