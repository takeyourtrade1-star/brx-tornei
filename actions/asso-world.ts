'use server';

import { getSession } from '@/lib/auth/session';
import { enforceServerRateLimit, ServerRateLimitExceeded } from '@/lib/security/server-rate-limit';
import { assoBetaRequestSchema } from '@/lib/validations/asso-beta';
import { registerBetaUser, isBetaUserRegistered } from '@/lib/data/asso-beta-store';

export interface AssoBetaActionState {
  success?: boolean;
  alreadyRegistered?: boolean;
  message?: string;
  error?: string;
}

export async function requestAssoBetaAction(input?: {
  notes?: string;
}): Promise<AssoBetaActionState> {
  const session = await getSession();
  if (!session) {
    return { error: 'Sessione non valida. Accedi per richiedere l’accesso alla beta.' };
  }

  const parsed = assoBetaRequestSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Richiesta non valida.' };
  }

  try {
    await enforceServerRateLimit({
      scope: 'asso-world-beta',
      subject: session.user.id,
      limit: 10,
      windowSeconds: 60,
    });
  } catch (error) {
    if (error instanceof ServerRateLimitExceeded) {
      return { error: 'Hai già inviato una richiesta di recente. Riprova più tardi.' };
    }
    return { error: 'Impossibile completare la richiesta in questo momento.' };
  }

  if (isBetaUserRegistered(session.user.id)) {
    return {
      success: true,
      alreadyRegistered: true,
      message: 'La tua candidatura è già registrata! Ti contatteremo non appena si apriranno i cancelli.',
    };
  }

  registerBetaUser(session.user.id);

  return {
    success: true,
    alreadyRegistered: false,
    message: 'Richiesta registrata! Sei ufficialmente nella lista d’attesa per la beta di Asso World.',
  };
}
