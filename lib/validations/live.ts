import { z } from 'zod';

export const liveViewRoleSchema = z.enum(['player', 'observer']);

export const liveViewSearchSchema = z.object({
  role: liveViewRoleSchema.optional().default('player'),
});

export type LiveViewRole = z.infer<typeof liveViewRoleSchema>;

export function parseLiveViewSearch(
  searchParams: Record<string, string | string[] | undefined>,
): { role: LiveViewRole } {
  const raw = searchParams.role;
  const role = typeof raw === 'string' ? raw : undefined;
  const parsed = liveViewSearchSchema.safeParse({ role });
  return parsed.success ? parsed.data : { role: 'player' };
}
