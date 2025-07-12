import { debuffSpec } from '@/type/Debuff';
import { z } from 'zod';

export const initiativeTableEntrySpec = z.object({
	id: z.string(),
	name: z.string(),
	race: z.string().optional(),
	initiative: z.number(),
	ac: z.number().optional(),
	healthDisplay: z.string(),
	effect: z.literal('invisible').optional(),
	debuffs: z.array(debuffSpec),
	description: z.string().optional(),
	images: z.array(z.string()).optional(),
});

export type InitiativeTableEntry = z.infer<typeof initiativeTableEntrySpec>;
