export class RoomNotFoundError extends Error {
	constructor(roomId: string) {
		super(`Room with ID ${roomId} not found.`);
		this.name = 'RoomNotFoundError';
	}
}

export class ConnectionError extends Error {
	constructor(message: string) {
		super(`Connection error: ${message}`);
		this.name = 'ConnectionError';
	}
}
