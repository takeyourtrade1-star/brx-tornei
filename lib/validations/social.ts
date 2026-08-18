import { z } from 'zod';
import { FORMATS } from '@/lib/data/catalog';

const formatKeys = FORMATS.map((f) => f.id) as [string, ...string[]];

export const searchPlayersSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, 'Inserisci almeno 2 caratteri per la ricerca')
    .max(30, 'Ricerca troppo lunga')
    .regex(/^[a-zA-Z0-9_]+$/, 'Caratteri non validi: usa solo lettere, numeri e underscore'),
});

export const friendRequestSchema = z.object({
  gamertag: z
    .string()
    .trim()
    .min(3, 'Il gamertag deve avere almeno 3 caratteri')
    .max(20, 'Il gamertag non può superare i 20 caratteri')
    .regex(/^[a-zA-Z0-9_]+$/, 'Formato gamertag non valido'),
});

export const respondFriendRequestSchema = z.object({
  requestId: z.string().min(1, 'ID richiesta mancante'),
  action: z.enum(['accept', 'decline']),
});

export const removeFriendSchema = z.object({
  gamertag: z
    .string()
    .trim()
    .min(3, 'Gamertag non valido')
    .max(20, 'Gamertag non valido'),
});

export const sendGameChallengeSchema = z.object({
  targetGamertag: z
    .string()
    .trim()
    .min(3, 'Gamertag avversario non valido')
    .max(20, 'Gamertag non valido'),
  format: z.enum(formatKeys as [string, ...string[]]),
  bestOf: z.enum(['BO1', 'BO3', 'BO5']),
});

export const respondGameChallengeSchema = z.object({
  challengeId: z.string().min(1, 'ID sfida mancante'),
  action: z.enum(['accept', 'decline']),
});
