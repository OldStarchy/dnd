import { creatureSchema } from '@/type/Creature';
import { z } from 'zod';

export const memberRequestSchema = z.union([
	z.object({
		type: z.literal('creature-list'),
	}),
	z.object({
		type: z.literal('creature-get'),
		id: z.string(),
	}),
	z.object({
		type: z.literal('creature-save'),
		id: z.string().nullable(),
		data: creatureSchema.omit({ id: true }),
	}),
]);

export type MemberRequest = z.infer<typeof memberRequestSchema>;
