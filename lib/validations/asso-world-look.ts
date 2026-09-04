import { z } from 'zod';
import {
  ASSO_WORLD_HAIRS,
  ASSO_WORLD_OUTFITS,
} from '@/types/asso-world';

export const assoWorldLookSchema = z.object({
  hair: z.enum(ASSO_WORLD_HAIRS),
  outfit: z.enum(ASSO_WORLD_OUTFITS),
}).strict();

export type AssoWorldLookInput = z.infer<typeof assoWorldLookSchema>;
