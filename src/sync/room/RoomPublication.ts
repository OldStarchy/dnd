import type { Subscription } from 'rxjs';
import type RoomHost from './RoomHost';
import type RoomHostConnection from './RoomHostConnection';
import type { MembershipToken, RoomCode } from './types';

export default class RoomPublication {
	constructor(
		readonly id: string,
		readonly token: MembershipToken,
		readonly roomCode: RoomCode,
		readonly host: RoomHost,
		readonly connection: RoomHostConnection,
		private teardown: Subscription,
	) {}

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

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore Friend function for Room
	private async revoke(): Promise<void> {
		this.connection.close();

		await this.host.room.delete(this.token);
		this.teardown.unsubscribe();
	}
}
