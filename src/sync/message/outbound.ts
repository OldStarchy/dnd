import type { UserMessage, UserMessageOfType } from './raw';

export abstract class OutboundMessage {
	abstract toUserMessage(): UserMessage;
}

export class OutboundNotification extends OutboundMessage {
	constructor(readonly data: UserMessageOfType<'notification'>) {
		super();
	}

	toUserMessage(): UserMessage {
		return { type: 'notification', data: this.data };
	}
}
