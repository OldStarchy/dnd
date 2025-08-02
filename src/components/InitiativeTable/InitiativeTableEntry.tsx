import { creatureSchema } from '@/type/Creature';
import { z } from 'zod';

export const initiativeTableEntrySchema = z.object({
	id: z.string(),
	effect: z.literal('invisible').optional(),
	healthDisplay: z.string(),
	initiative: z.number(),

	creature: z
		.object({
			type: z.literal('unique'),
			id: z.string(),
		})
		.or(
			z.object({
				type: z.literal('generic'),
				data: creatureSchema.omit({ id: true }),
			}),
		),
});

export type InitiativeTableEntry = z.infer<typeof initiativeTableEntrySchema>;
