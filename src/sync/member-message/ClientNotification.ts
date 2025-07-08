import { z } from 'zod';

export const clientNotificationSpec = z.union([
	z.object({
		type: z.literal('ready'),
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
]);

export type ClientNotification = z.infer<typeof clientNotificationSpec>;
