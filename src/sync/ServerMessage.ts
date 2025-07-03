import { z } from 'zod';
import { serverNotificationSpec } from './ServerNotification';

export const serverMessageSpec = z.union([
	z.object({
		type: z.literal('notification'),
		notification: serverNotificationSpec,
	}),
	z.object({
		type: z.literal('response'),
		id: z.string(),
		response: z.any(), // TODO: Replace with a more specific schema if possible
	}),
]);

export type ServerMessage = z.infer<typeof serverMessageSpec>;
