import { z } from 'zod';

export const systemMessageSpec = z.union([
	z.object({
		type: z.literal('roomCreated'),
		token: z.string(),
		roomCode: z.string(),
	}),
	z.object({
		type: z.literal('roomFound'),
		roomCode: z.string(),
	}),
	z.object({
		type: z.literal('roomJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('userJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('connectionReplaced'),
	}),
]);

export type SystemMessage = z.infer<typeof systemMessageSpec>;
