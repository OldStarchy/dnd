import type { InitiativeTableEntry } from '@/components/InitiativeTable/InitiativeTableRow';
import { z } from 'zod';

export const serverNotificationSpec = z.union([
	z.object({
		type: z.literal('initiative-table-update'),
		data: z.custom<InitiativeTableEntry[]>(), // TODO: Replace with a more specific schema if possible
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
]);

export type ServerNotification = z.infer<typeof serverNotificationSpec>;
