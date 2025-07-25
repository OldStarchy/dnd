import { z } from 'zod';

const roomCreated = z.object({
	token: z.string(),
	roomCode: z.string(),
});
const roomFound = z.object({
	roomCode: z.string(),
	isGm: z.boolean(),
});
const roomJoined = z.object({
	token: z.string(),
});

export class BackendApi {
	readonly host: string;

	constructor(host: string) {
		this.host = host;
	}

	async createRoom(): Promise<{ token: string; roomCode: string }> {
		const response = await fetch(`${this.host}/room`, {
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

		const message = parsed.data;
		return {
			token: message.token,
			roomCode: message.roomCode,
		};
	}

	async deleteRoom(roomCode: string): Promise<void> {
		const response = await fetch(`${this.host}/room/${roomCode}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to delete room: ${response.statusText}`);
		}
	}

	async getRoom(token: string): Promise<{ roomCode: string; isGm: boolean }> {
		const response = await fetch(`${this.host}/room`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
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

		const message = parsed.data;
		return { roomCode: message.roomCode, isGm: message.isGm };
	}

	async joinRoom(roomCode: string): Promise<{ token: string }> {
		const response = await fetch(`${this.host}/room/${roomCode}/join`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({}),
		});

		if (!response.ok) {
			throw new Error(`Failed to join room: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = roomJoined.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		const message = parsed.data;
		return { token: message.token };
	}

	connectToRoom(token: string): WebSocket {
		const ws = new WebSocket(
			`${this.host.replace(/^http/, 'ws')}/ws/${token}`,
		);

		return ws;
	}
}
