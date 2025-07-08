import { z } from 'zod';
import { systemMessageSpec } from '../systemMessageSpec';
import { clientNotificationSpec } from './ClientNotification';
export const clientRequestSpec = z.object({
	id: z.string(),
	request: z.unknown().refine((x) => x !== undefined), // TODO: Replace with a more specific schema if possible
});

export const clientMessageSpec = z.union([
	z.object({
		type: z.literal('notification'),
		data: clientNotificationSpec,
	}),
	z.object({
		type: z.literal('request'),
		data: clientRequestSpec,
	}),
	z.object({
		type: z.literal('system-message'),
		data: systemMessageSpec,
	}),
]);

export type ClientMessage = z.infer<typeof clientMessageSpec>;
