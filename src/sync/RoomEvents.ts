import z from 'zod';

export const systemNotification = z.union([
	z.object({
		type: z.literal('room.members.joined'),
		data: z.object({
			id: z.string(),
		}),
	}),
	z.object({
		type: z.literal('room.members.left'),
		data: z.object({
			id: z.string(),
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
			id: z.string(),
			connected: z.boolean(),
		}),
	}),
	z.object({
		type: z.literal('room.deleted'),
		data: z.void(),
	}),
	z.object({
		type: z.literal('user.message'),
		data: z.object({
			sender: z.string(),
			data: z.unknown(),
		}),
	}),
]);

export type SystemNotification = z.infer<typeof systemNotification>;

export interface SystemNotifications {
	/**
	 * Triggered during a successful call to `ServerApi.join(roomCode)`
	 */
	'room.members.joined': (SystemNotification & {
		type: 'room.members.joined';
	})['data'];

	/**
	 * Another member left
	 */
	'room.members.left': (SystemNotification & {
		type: 'room.members.left';
	})['data'];

	/**
	 * You were kicked
	 */
	'room.members.kicked': (SystemNotification & {
		type: 'room.members.kicked';
	})['data'];

	/**
	 * Triggered when the first WebSocket from a user connects and when the last
	 * WebSocket from a user disconnects.
	 */
	'room.members.presence': (SystemNotification & {
		type: 'room.members.presence';
	})['data'];

	/**
	 * Sent to all connected sockets when the Room is deleted via the Rest API
	 */
	'room.deleted': (SystemNotification & { type: 'room.deleted' })['data'];

	/**
	 * Triggered when a message from another user is sent to this user
	 */
	'user.message': (SystemNotification & { type: 'user.message' })['data'];
}
