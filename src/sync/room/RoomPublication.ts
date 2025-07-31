import type RoomHost from './RoomHost';
import type { MembershipToken, RoomCode } from './types';

export default class RoomPublication {
	readonly token: MembershipToken;
	readonly roomCode: RoomCode;
	readonly host: RoomHost;

	constructor(token: MembershipToken, roomCode: RoomCode, host: RoomHost) {
		this.token = token;
		this.roomCode = roomCode;
		this.host = host;
	}

	createShareUrl(): URL {
		// TODO:
	}

	async revoke(): Promise<void> {
		// TODO:
	}
}
