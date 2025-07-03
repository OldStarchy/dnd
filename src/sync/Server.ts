import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

export type ClientMessageHandler<
	Request = ClientRequest,
	Response = ServerResponse,
	TClientNotification = ClientNotification,
	TServerNotification = ServerNotification,
> = {
	handleRequest(
		this: Server<TServerNotification>,
		request: Request,
	): Promise<Response>;
	handleNotification(
		this: Server<TServerNotification>,
		notification: TClientNotification,
	): void;
};

export interface Server<TServerNotification = ServerNotification>
	extends Disposable {
	notify(update: TServerNotification): void;
}
