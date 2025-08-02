import type { Subscription } from 'rxjs';
import type RoomHost from './RoomHost';
import type { MembershipToken, RoomCode } from './types';

export default class RoomPublication {
	readonly id: string;
	readonly token: MembershipToken;
	readonly roomCode: RoomCode;
	readonly host: RoomHost<any>;
	private subs: Subscription;

	constructor(
		id: string,
		token: MembershipToken,
		roomCode: RoomCode,
		host: RoomHost<any>,
		subs: Subscription,
	) {
		this.id = id;
		this.token = token;
		this.roomCode = roomCode;
		this.host = host;
		this.subs = subs;
	}

	createShareUrl(): URL {
		const roomHost = this.host.host;
		const code = this.roomCode;

		// TODO: Format TBC
		const url = new URL(window.location.origin);
		url.pathname = '/room/join';
		url.searchParams.set('roomCode', code);
		url.searchParams.set('host', roomHost.toString());

		return url;
	}

	async revoke(): Promise<void> {
		// TODO: remove from this room._hosts
		this.subs.unsubscribe();
	}
}
