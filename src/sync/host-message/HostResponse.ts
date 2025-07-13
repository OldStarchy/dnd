import { creatureSchema } from '@/type/Creature';
import { z } from 'zod';

export const hostResponseSchema = z.union([
	creatureSchema.or(z.null()),
	creatureSchema.array(),
	z.boolean(),
]);

export type HostResponse = z.infer<typeof hostResponseSchema>;
