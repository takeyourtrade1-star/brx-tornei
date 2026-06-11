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
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Il backend vuole SOLO email O username, mai entrambi. */
export function buildLoginPayload(input: LoginInput): Record<string, string> {
  const isEmail = input.identifier.includes('@');
  return {
    password: input.password,
    website_url: '',
    ...(isEmail ? { email: input.identifier } : { username: input.identifier }),
  };
}
