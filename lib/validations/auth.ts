import { z } from 'zod';

/**
 * Schema login — speculare al backend Ebartex:
 * email O username + password, honeypot `website_url` sempre stringa vuota.
 */
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Inserisci email o username')
    .max(255),
  password: z.string().min(1, 'Inserisci la password').max(255),
  /** Honeypot anti-bot: se un bot lo compila, la validazione DEVE fallire. */
  website_url: z.string().max(0, 'Richiesta non valida'),
  redirect: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Schema verifica MFA (6 cifre numeriche). */
export const verifyMfaFormSchema = z.object({
  mfa_code: z
    .string()
    .length(6, 'Il codice MFA deve essere di 6 cifre')
    .regex(/^\d+$/, 'Il codice MFA deve contenere solo numeri'),
  remember_device: z
    .string()
    .optional()
    .transform((v) => v === 'on' || v === 'true'),
  redirect: z.string().optional(),
});

export type VerifyMfaFormInput = z.infer<typeof verifyMfaFormSchema>;

/** Schema richiesta codice login via email. */
export const loginCodeRequestSchema = z.object({
  email: z.string().min(1, 'Inserisci la email').email('Email non valida'),
  redirect: z.string().optional(),
});

export type LoginCodeRequestInput = z.infer<typeof loginCodeRequestSchema>;

/** Schema verifica codice login via email (8 caratteri alfanumerici lowercase). */
export const loginCodeVerifySchema = z.object({
  email: z.string().min(1, 'Inserisci la email').email('Email non valida'),
  code: z
    .string()
    .min(1, 'Inserisci il codice')
    .length(8, 'Il codice deve essere di 8 caratteri')
    .regex(/^[a-z0-9]+$/, 'Il codice deve contenere solo lettere minuscole e numeri')
    .transform((v) => v.toLowerCase()),
  redirect: z.string().optional(),
});

export type LoginCodeVerifyInput = z.infer<typeof loginCodeVerifySchema>;

/** Il backend vuole SOLO email O username, mai entrambi. */
export function buildLoginPayload(input: LoginInput): Record<string, string> {
  const isEmail = input.identifier.includes('@');
  return {
    password: input.password,
    website_url: '',
    ...(isEmail ? { email: input.identifier } : { username: input.identifier }),
  };
}
