import { z } from 'zod';
import { systemMessageSpec } from './systemMessageSpec';

const systemResponseSpec = z.object({
	type: z.literal('systemMessage'),
	data: systemMessageSpec,
});

export class BackendApi {
	readonly httpHost: string;
	readonly wsHost: string;

	constructor(host: string) {
		this.httpHost = host;
		this.wsHost = host.replace(/^http/, 'ws');
	}

	async createRoom(): Promise<{ token: string; roomCode: string }> {
		const response = await fetch(`${this.httpHost}/new`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to create room: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = systemResponseSpec.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		const message = parsed.data.data;
		if (message.type !== 'roomCreated') {
			throw new Error(`Unexpected message type: ${message.type}`);
		}
		return {
			token: message.token,
			roomCode: message.roomCode,
		};
	}

	async deleteRoom(roomCode: string): Promise<void> {
		const response = await fetch(`${this.httpHost}/delete/${roomCode}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to delete room: ${response.statusText}`);
		}
	}

	async checkToken(token: string): Promise<{ roomCode: string }> {
		const response = await fetch(`${this.httpHost}/check/${token}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to check token: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = systemResponseSpec.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		const message = parsed.data.data;
		if (message.type !== 'roomFound') {
			throw new Error(`Unexpected message type: ${message.type}`);
		}
		return { roomCode: message.roomCode };
	}

	async joinRoom(roomCode: string): Promise<{ token: string }> {
		const response = await fetch(`${this.httpHost}/join/${roomCode}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to join room: ${response.statusText}`);
		}

		const data = await response.json();
		const parsed = systemResponseSpec.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid response format: ${parsed.error.message}`);
		}

		const message = parsed.data.data;
		if (message.type !== 'roomJoined') {
			throw new Error(`Unexpected message type: ${message.type}`);
		}
		return { token: message.token };
	}

	connectToRoom(token: string): WebSocket {
		const ws = new WebSocket(`${this.wsHost}/ws/${token}`);

		return ws;
		// return new Promise((resolve, reject) => {
		// 	ws.onopen = () => resolve(ws);
		// 	ws.onerror = (error) =>
		// 		reject(new Error(`WebSocket error: ${error}`));
		// 	ws.onclose = () => reject(new Error('WebSocket connection closed'));
		// });
	}
}
