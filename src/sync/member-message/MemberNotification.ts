import { z } from 'zod';

export const memberNotificationSpec = z.union([
	z.object({
		type: z.literal('ready'),
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
]);

export type MemberNotification = z.infer<typeof memberNotificationSpec>;
