import type { Deferred } from '@/deferred';
import type { MemberId } from '../room/types';
import type { UserMessageOfType } from './raw';

export abstract class InboundMessage<Data> {
	constructor(
		readonly senderId: MemberId,
		readonly data: Data,
	) {}
}

export class InboundRequest<
	Request extends UserMessageOfType<'request'> = UserMessageOfType<'request'>,
> extends InboundMessage<Request> {
	constructor(
		senderId: MemberId,
		data: Request,
		readonly response: Deferred<UserMessageOfType<'response'>>,
	) {
		super(senderId, data);
	}

	resolve(response: UserMessageOfType<'response'>) {
		this.response.resolve(response);
	}

	reject(error: string) {
		this.response.reject(error);
	}

	respond(promise: () => Promise<UserMessageOfType<'response'>>) {
		promise().then(
			(response) => {
				this.response.resolve(response);
			},
			(error) => {
				this.response.reject(error);
			},
		);
	}
}

export class InboundNotification<
	Notification extends
		UserMessageOfType<'notification'> = UserMessageOfType<'notification'>,
> extends InboundMessage<Notification> {
	constructor(senderId: MemberId, data: Notification) {
		super(senderId, data);
	}
}
