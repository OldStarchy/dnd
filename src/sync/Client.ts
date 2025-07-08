import type { ServerNotification } from './host-message/ServerNotification';
import type { ServerResponse } from './host-message/ServerResponse';
import type { ClientNotification } from './member-message/ClientNotification';
import type { ClientRequest } from './member-message/ClientRequest';

export type ServerMessageHandler = {
	handleNotification(this: Client, notification: ServerNotification): void;
	handleSystemMessage?(
		this: Client,
		message:
			| { type: 'room_created'; code: string }
			| { type: 'token'; token: string },
	): void;
};

export interface Client extends Disposable {
	request(request: ClientRequest): Promise<ServerResponse>;
	notify(notification: ClientNotification): void;
}
