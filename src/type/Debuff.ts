import { z } from 'zod';

export const debuffSpec = z.object({
	name: z.string().min(1, 'Name is required'),
	color: z.string().min(1, 'Color is required'),
	notes: z.string().optional(),
	description: z.string().optional(),
	duration: z.coerce
		.number()
		.int()
		.min(0, 'Duration must be a non-negative integer')
		.transform((val) => (val === 0 ? undefined : val))
		.optional(),
});

export type Debuff = z.infer<typeof debuffSpec>;

export const Debuff = {
	stunned: {
		name: 'Stunned',
		description:
			'The creature is incapacitated and can only take actions that do not require movement.',
		color: 'bg-red-500',
	},
	poisoned: {
		name: 'Poisoned',
		description:
			'The creature has disadvantage on attack rolls and ability checks.',
		color: 'bg-green-500',
	},
	blinded: {
		name: 'Blinded',
		description:
			'The creature cannot see and automatically fails any ability check that requires sight.',
		color: 'bg-blue-500',
	},
	paralyzed: {
		name: 'Paralyzed',
		description: 'The creature is incapacitated and cannot move or speak.',
		color: 'bg-yellow-500',
	},
} as const satisfies Record<string, Omit<Debuff, 'duration' | 'notes'>>;
