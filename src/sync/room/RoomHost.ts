import { z } from 'zod';
import { inboundSystemMessageSchema } from '../message/schema/InboundSystemMessage';
import { ClosableJsonTransport } from '../transports/JsonTransport';
import ReconnectingWebSocket from './ReconnectingWebSocket';
import RoomHostConnection from './RoomHostConnection';
import type { MembershipToken } from './types';

const roomCreated = z.object({
	membershipToken: z.string().brand<'MembershipToken'>(),
	roomCode: z.string().brand<'RoomCode'>(),
});
const roomJoined = z.object({
	membershipToken: z.string().brand<'MembershipToken'>(),
});
const roomFound = z.object({
	roomCode: z.string().brand<'RoomCode'>(),
	id: z.string().brand<'MemberId'>(),
	gameMasterId: z.string().brand<'MemberId'>(),
	members: z
		.object({
			id: z.string().brand<'MemberId'>(),
			online: z.boolean(),
		})
		.array(),
});

export default class RoomHost {
	static registry = new Map<string, RoomHost>();

	static get(host: string): RoomHost {
		let existing = this.registry.get(host);
		if (!existing) {
			existing = new RoomHost(host);
			this.registry.set(host, existing);
		}
		return existing;
	}

	readonly host: string;

	private constructor(host: string) {
		this.host = host;
	}

	readonly room = new RoomResource(this);
}

class RoomResource {
	private server: RoomHost;
	constructor(host: RoomHost) {
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

	async leave(membershipToken: MembershipToken): Promise<void> {
		const response = await fetch(`${this.server.host}/room/leave`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${membershipToken}`,
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to leave room: ${response.statusText}`);
		}
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
	): Promise<RoomHostConnection> {
		const info = await this.get(membershipToken);
		if (!info.id) {
			throw new Error('Room not found or invalid membership token');
		}

		const { id, gameMasterId, members } = info;

		const ws = new ReconnectingWebSocket(
			`${this.server.host.replace(/^http/, 'ws')}/room/ws/${membershipToken}`,
		);

		const connection = new ClosableJsonTransport(
			ws,
			inboundSystemMessageSchema,
		);

		return new RoomHostConnection(
			id,
			gameMasterId,
			members,
			this.server,
			connection,
		);
	}
}
