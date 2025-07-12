import { z } from 'zod';

export const serverNotificationSpec = z.union([
	z.object({
		type: z.literal('userJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('connectionReplaced'),
	}),
]);

export type ServerNotification = z.infer<typeof serverNotificationSpec>;
