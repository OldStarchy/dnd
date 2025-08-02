import { z } from 'zod';
import RoomHostConnection from './RoomHostConnection';
import type { MembershipToken } from './types';

const roomCreated = z.object({
	id: z.string(),
	membershipToken: z.string(),
	roomCode: z.string(),
});
const roomJoined = z.object({
	membershipToken: z.string(),
});
const roomFound = z.object({
	roomCode: z.string(),
	id: z.string(),
	gameMasterId: z.string(),
	members: z
		.object({
			id: z.string(),
			online: z.boolean(),
		})
		.array(),
});

export default class RoomHost<TUserMessage> {
	readonly host: string;
	readonly userMessageSchema: z.ZodSchema<TUserMessage>;

	constructor(host: string, userMessageSchema: z.ZodSchema<TUserMessage>) {
		this.host = host;
		this.userMessageSchema = userMessageSchema;
	}

	readonly room = new RoomResource(this);
}

class RoomResource<TUserMessage> {
	private server: RoomHost<TUserMessage>;
	constructor(host: RoomHost<TUserMessage>) {
		this.server = host;
	}
	async create(): Promise<z.infer<typeof roomCreated>> {
		const response = await fetch(`${this.server.host}/room`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}),
		});

		if (!response.ok) {
			throw new Error(`Failed to create room: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = roomCreated.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		return parsed.data;
	}

	async join(roomCode: string): Promise<z.infer<typeof roomJoined>> {
		const response = await fetch(
			`${this.server.host}/room/${roomCode}/join`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({}),
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to join room: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = roomJoined.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		return parsed.data;
	}

	async get(
		membershipToken: MembershipToken,
	): Promise<z.infer<typeof roomFound>> {
		const response = await fetch(`${this.server.host}/room`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to check token: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = roomFound.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		return parsed.data;
	}

	async delete(membershipToken: MembershipToken): Promise<void> {
		const response = await fetch(`${this.server.host}/room`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to delete room: ${response.statusText}`);
		}
	}

	async connect(
		membershipToken: MembershipToken,
	): Promise<RoomHostConnection<TUserMessage>> {
		const info = await this.get(membershipToken);
		if (!info.id) {
			throw new Error('Room not found or invalid membership token');
		}

		const { id, gameMasterId, members } = info;

		const ws = new WebSocket(
			`${this.server.host.replace(/^http/, 'ws')}/room/ws/${membershipToken}`,
		);

		return new RoomHostConnection(
			id,
			gameMasterId,
			members,
			this.server,
			ws,
		);
	}
}
