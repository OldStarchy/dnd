import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

export type ClientMessageHandler = {
	handleRequest(
		this: Server,
		request: ClientRequest,
	): Promise<ServerResponse>;
	handleNotification(this: Server, notification: ClientNotification): void;
};

export interface Server extends Disposable {
	notify(update: ServerNotification): void;
}
