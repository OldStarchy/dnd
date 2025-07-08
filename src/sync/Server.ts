import type { ServerNotification } from './host-message/ServerNotification';
import type { ServerResponse } from './host-message/ServerResponse';
import type { ClientNotification } from './member-message/ClientNotification';
import type { ClientRequest } from './member-message/ClientRequest';
import type { SystemMessage } from './systemMessageSpec';

export type ClientMessageHandler = {
	handleRequest(
		this: Server,
		request: ClientRequest,
	): Promise<ServerResponse>;
	handleNotification(this: Server, notification: ClientNotification): void;
	handleSystemMessage?(this: Server, message: SystemMessage): void;
};

export interface Server extends Disposable {
	notify(update: ServerNotification): void;
}
