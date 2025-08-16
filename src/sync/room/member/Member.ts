import type CancellablePromise from '@/lib/CancellablePromise';
import type { UserMessageOfType } from '@/sync/message/raw';
import { BehaviorSubject } from 'rxjs';
import type RoomHostConnection from '../RoomHostConnection';
import type { MemberId } from '../types';

export default class Member {
	constructor(
		private connection: RoomHostConnection,
		readonly id: MemberId,
		readonly online$: BehaviorSubject<boolean>,
	) {}

	notify(notification: UserMessageOfType<'notification'>) {
		return this.connection['_send']({
			to: this.id,
			data: {
				type: 'notification',
				data: notification,
			},
		});
	}

	request(
		request: UserMessageOfType<'request'>,
	): CancellablePromise<UserMessageOfType<'response'>> {
		return this.connection['request'](this.id, request);
	}
}
