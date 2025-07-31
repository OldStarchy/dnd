import z from 'zod';

export const memberSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
	avatar: z.string().optional(),
});
export type Member = z.infer<typeof memberSchema>;
