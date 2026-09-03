/**
 * Registro in-memory lato server per le richieste di partecipazione alla beta di Asso World.
 */

const registeredBetaUsers = new Set<string>();

export function registerBetaUser(userId: string): boolean {
  registeredBetaUsers.add(userId);
  return true;
}

export function isBetaUserRegistered(userId: string): boolean {
  return registeredBetaUsers.has(userId);
}
