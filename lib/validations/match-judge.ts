import { z } from 'zod';

/** Vincoli condivisi con il Tournament Service per una domanda Judge. */
export const matchJudgeMatchIdSchema = z.string().uuid();

export const matchJudgeRequestSchema = z.object({
  client_request_id: z.string().uuid(),
  question: z.string().trim().min(1, 'Scrivi una domanda.').max(1000, 'La domanda è troppo lunga.'),
});

export type MatchJudgeRequest = z.infer<typeof matchJudgeRequestSchema>;
