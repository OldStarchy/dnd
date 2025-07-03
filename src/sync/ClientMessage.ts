import { z } from 'zod';
import { clientNotificationSpec } from './ClientNotification';

export const clientMessageSpec = z.union([
	z.object({
		type: z.literal('notification'),
		notification: clientNotificationSpec,
	}),
	z.object({
		type: z.literal('request'),
		id: z.string(),
		request: z.unknown().refine((x) => x !== undefined), // TODO: Replace with a more specific schema if possible
	}),
]);

export type ClientMessage = z.infer<typeof clientMessageSpec>;
