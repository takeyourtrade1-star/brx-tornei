/**
 * Tessera "Associato" — store mock (nessun backend).
 *
 * Lo stato vive in localStorage finché non esiste un microservizio dedicato.
 * `status: 'none'` ⇒ l'utente non ha ancora visto l'onboarding (primo accesso).
 */

export interface MembershipCard {
  /** Codice leggibile della tessera, es. "EBX-2026-7F3K9Q". */
  code: string;
  /** Numero stampato sulla tessera (16 cifre raggruppate). */
  serial: string;
  firstName: string;
  lastName: string;
  /** ISO yyyy-mm-dd. */
  birthDate: string;
  email: string;
  phone: string;
  city: string;
  /** Circolo / negozio Ebartex di riferimento. */
  club: string;
  /** Livello associativo (mock). */
  tier: string;
  /** ISO della data di emissione. */
  memberSince: string;
}

export type MembershipState =
  | { status: 'none' }
  | { status: 'skipped' }
  | { status: 'member'; card: MembershipCard };

export interface MembershipInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  city: string;
  club: string;
}

const STORAGE_KEY = 'ebartex.membership.v1';
const DEFAULT_TIER = 'Socio Ordinario';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomToken(length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

function randomSerial(): string {
  let digits = '';
  for (let i = 0; i < 16; i += 1) digits += Math.floor(Math.random() * 10);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Genera una tessera a partire dai dati del form (tutto client-side). */
export function createCard(input: MembershipInput): MembershipCard {
  const year = new Date().getFullYear();
  return {
    code: `EBX-${year}-${randomToken(6)}`,
    serial: randomSerial(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthDate: input.birthDate,
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    club: input.club.trim(),
    tier: DEFAULT_TIER,
    memberSince: new Date().toISOString(),
  };
}

function isCard(value: unknown): value is MembershipCard {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return typeof c.code === 'string' && typeof c.firstName === 'string';
}

/** Legge lo stato dalla persistenza locale. SSR-safe (ritorna `none`). */
export function readMembership(): MembershipState {
  if (typeof window === 'undefined') return { status: 'none' };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: 'none' };
    const parsed = JSON.parse(raw) as MembershipState;
    if (parsed?.status === 'member' && isCard(parsed.card)) return parsed;
    if (parsed?.status === 'skipped') return { status: 'skipped' };
    return { status: 'none' };
  } catch {
    return { status: 'none' };
  }
}

export function writeMembership(state: MembershipState): void {
  if (typeof window === 'undefined') return;
  try {
    if (state.status === 'none') window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage non disponibile: la modalità mock resta in memoria del componente */
  }
}

export function clearMembership(): void {
  writeMembership({ status: 'none' });
}

/** Nome completo del titolare (per intestazioni). */
export function cardHolder(card: MembershipCard): string {
  return `${card.firstName} ${card.lastName}`.trim();
}

/** "Socio dal 24 giu 2026" — formattazione IT della data di emissione. */
export function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
