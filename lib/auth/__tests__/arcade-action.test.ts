import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  configured: vi.fn(),
  verifyPassword: vi.fn(),
  grantAccess: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/auth/arcade-access', () => ({
  grantArcadeAccess: mocks.grantAccess,
  isArcadeAccessConfigured: mocks.configured,
  verifyArcadePassword: mocks.verifyPassword,
}));
vi.mock('@/lib/security/server-rate-limit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/security/server-rate-limit')>();
  return { ...actual, enforceServerRateLimit: mocks.enforceRateLimit };
});
import { unlockArcadeAction } from '@/actions/arcade';
import { ServerRateLimitExceeded } from '@/lib/security/server-rate-limit';

function passwordForm(password = 'password-riservata'): FormData {
  const form = new FormData();
  form.set('password', password);
  return form;
}

describe('unlockArcadeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.configured.mockReturnValue(true);
    mocks.verifyPassword.mockReturnValue(true);
    mocks.grantAccess.mockResolvedValue(true);
    mocks.enforceRateLimit.mockResolvedValue(undefined);
  });

  it('richiede una sessione autenticata', async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(unlockArcadeAction(passwordForm())).resolves.toEqual({
      error: 'Sessione scaduta. Accedi di nuovo.',
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('limita i tentativi prima di confrontare la password', async () => {
    mocks.enforceRateLimit.mockRejectedValue(new ServerRateLimitExceeded());

    await expect(unlockArcadeAction(passwordForm())).resolves.toEqual({
      error: 'Troppi tentativi. Riprova tra qualche minuto.',
    });
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith({
      scope: 'arcade-access',
      subject: 'user-1',
      limit: 5,
      windowSeconds: 300,
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
  });

  it('non concede il cookie con una password errata', async () => {
    mocks.verifyPassword.mockReturnValue(false);

    await expect(unlockArcadeAction(passwordForm('password-errata'))).resolves.toEqual({
      error: 'Password della Sala Arcade non corretta.',
    });
    expect(mocks.grantAccess).not.toHaveBeenCalled();
  });

  it('concede l’accesso solo dopo verifica positiva', async () => {
    await expect(unlockArcadeAction(passwordForm())).resolves.toEqual({ success: true });
    expect(mocks.grantAccess).toHaveBeenCalledWith('user-1');
  });
});
