import { initiativeTableEntrySpec } from '@/components/InitiativeTable/InitiativeTableEntry';
import { z } from 'zod';

export const serverNotificationSpec = z.union([
	z.object({
		type: z.literal('initiativeTableUpdate'),
		data: z.array(initiativeTableEntrySpec),
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
]);

export type ServerNotification = z.infer<typeof serverNotificationSpec>;
