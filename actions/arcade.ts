'use server';

import { getSession } from '@/lib/auth/session';
import {
  grantArcadeAccess,
  isArcadeAccessConfigured,
  verifyArcadePassword,
} from '@/lib/auth/arcade-access';
import {
  enforceServerRateLimit,
  ServerRateLimitExceeded,
} from '@/lib/security/server-rate-limit';
import { arcadeAccessSchema } from '@/lib/validations/arcade-access';

export interface ArcadeAccessActionState {
  success?: true;
  error?: string;
}
export async function unlockArcadeAction(
  formData: FormData,
): Promise<ArcadeAccessActionState> {
  const parsed = arcadeAccessSchema.safeParse({
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Password non valida.' };
  }

  const session = await getSession();
  if (!session) return { error: 'Sessione scaduta. Accedi di nuovo.' };
  if (!isArcadeAccessConfigured()) {
    return { error: 'La Sala Arcade non è ancora configurata.' };
  }

  try {
    await enforceServerRateLimit({
      scope: 'arcade-access',
      subject: session.user.id,
      limit: 5,
      windowSeconds: 5 * 60,
    });
  } catch (error) {
    if (error instanceof ServerRateLimitExceeded) {
      return { error: 'Troppi tentativi. Riprova tra qualche minuto.' };
    }
    return { error: 'Controllo accesso temporaneamente non disponibile.' };
  }

  if (!verifyArcadePassword(parsed.data.password)) {
    return { error: 'Password della Sala Arcade non corretta.' };
  }
  if (!(await grantArcadeAccess(session.user.id))) {
    return { error: 'Impossibile autorizzare l’accesso alla Sala Arcade.' };
  }
  return { success: true };
}
