import z from 'zod';
import type { MessageOfType } from '../MessageOfType';

export const inboundSystemMessageSchema = z.union([
	z.object({
		type: z.literal('room.members.joined'),
		data: z.object({
			id: z.string().brand<'MemberId'>(),
		}),
	}),
	z.object({
		type: z.literal('room.members.left'),
		data: z.object({
			id: z.string().brand<'MemberId'>(),
			reason: z.string().optional(),
		}),
	}),
	z.object({
		type: z.literal('room.members.kicked'),
		data: z.object({
			reason: z.string().optional(),
		}),
	}),
	z.object({
		type: z.literal('room.members.presence'),
		data: z.object({
			id: z.string().brand<'MemberId'>(),
			connected: z.boolean(),
		}),
	}),
	z.object({
		type: z.literal('room.deleted'),
		data: z.void(),
	}),
	z.object({
		type: z.literal('member.message'),
		data: z.object({
			sender: z.string().brand<'MemberId'>(),
			message: z.any(),
		}),
	}),
]);

export type InboundSystemMessage = z.infer<typeof inboundSystemMessageSchema>;

export type InboundSystemMessageOfType<T extends InboundSystemMessage['type']> =
	MessageOfType<InboundSystemMessage, T>;
