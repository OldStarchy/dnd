import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

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
