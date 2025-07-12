import { initiativeTableEntrySpec } from '@/components/InitiativeTable/InitiativeTableEntry';
import { z } from 'zod';

export const hostNotificationSpec = z.union([
	z.object({
		type: z.literal('initiativeTableUpdate'),
		data: z.array(initiativeTableEntrySpec),
	}),
	z.object({
		type: z.literal('heartbeat'),
	}),
	// System messages migrated to notifications
	z.object({
		type: z.literal('roomCreated'),
		token: z.string(),
		roomCode: z.string(),
	}),
	z.object({
		type: z.literal('roomFound'),
		roomCode: z.string(),
	}),
	z.object({
		type: z.literal('roomJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('userJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('connectionReplaced'),
	}),
]);

export type HostNotification = z.infer<typeof hostNotificationSpec>;
