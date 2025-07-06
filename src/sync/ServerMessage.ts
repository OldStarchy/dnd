import { z } from 'zod';
import { serverNotificationSpec } from './ServerNotification';
import { systemMessageSpec } from './systemMessageSpec';

export const serverMessageSpec = z.union([
	z.object({
		type: z.literal('notification'),
		data: serverNotificationSpec,
	}),
	z.object({
		type: z.literal('response'),
		data: z.object({
			id: z.string(),
			response: z.any(), // TODO: Replace with a more specific schema if possible
		}),
	}),
	z.object({
		type: z.literal('system-message'),
		data: systemMessageSpec,
	}),
]);

export type ServerMessage = z.infer<typeof serverMessageSpec>;
