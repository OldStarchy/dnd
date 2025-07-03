import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

export type ServerMessageHandler<
	Request = ClientRequest,
	Response = ServerResponse,
	TClientNotification = ClientNotification,
	TServerNotification = ServerNotification,
> = {
	handleNotification(
		this: Client<Request, Response, TClientNotification>,
		notification: TServerNotification,
	): void;
};

export interface Client<
	Request = ClientRequest,
	Response = ServerResponse,
	Notification = ClientNotification,
> extends Disposable {
	request(request: Request): Promise<Response>;
	notify(notification: Notification): void;
}
