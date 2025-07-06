import { z } from 'zod';
import { clientNotificationSpec } from './ClientNotification';
import { systemMessageSpec } from './systemMessageSpec';

export const clientMessageSpec = z.union([
	z.object({
		type: z.literal('notification'),
		data: clientNotificationSpec,
	}),
	z.object({
		type: z.literal('request'),
		data: z.object({
			id: z.string(),
			request: z.unknown().refine((x) => x !== undefined), // TODO: Replace with a more specific schema if possible
		}),
	}),
	z.object({
		type: z.literal('system-message'),
		data: systemMessageSpec,
	}),
]);

export type ClientMessage = z.infer<typeof clientMessageSpec>;
