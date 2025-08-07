import { initiativeTableEntrySchema } from '@/components/InitiativeTable/InitiativeTableEntry';
import { z } from 'zod';

export const hostNotificationSpec = z.union([
	z.object({
		type: z.literal('initiativeTableUpdate'),
		data: z.object({
			entries: z.array(initiativeTableEntrySchema),
			currentTurnId: z.string().nullable(),
		}),
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
]);

export type HostNotification = z.infer<typeof hostNotificationSpec>;
