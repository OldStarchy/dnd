import { clientMessageSpec } from './ClientMessage';
import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ClientMessageHandler, Server } from './Server';
import type { ServerMessage } from './ServerMessage';
import type { ServerNotification } from './ServerNotification';

export class MessagePortServer implements Server, Disposable {
	private port: MessagePort;
	private handler: ClientMessageHandler;

	constructor(port: MessagePort, handler: ClientMessageHandler) {
		this.port = port;
		this.handler = handler;

		this.port.addEventListener('message', this.#handleMessage);
	}

	[Symbol.dispose]() {
		this.port.removeEventListener('message', this.#handleMessage);
	}

	#handleMessage = (event: MessageEvent): void => {
		this.handleMessageData(event.data);
	};

	private async handleMessageData(data: unknown): Promise<void> {
		const parsedData = clientMessageSpec.safeParse(data);
		if (!parsedData.success) {
			console.error('Invalid message data received:', data);
			return;
		}
		const message = parsedData.data;
		switch (message.type) {
			case 'request': {
				const { request, id } = message.data;

				const response = await this.handler.handleRequest.call(
					this,
					request as ClientRequest,
				);

				this.port.postMessage({
					type: 'response',
					data: { id, response },
				} as ServerMessage);
				return;
			}
			case 'notification': {
				const notification = message.data as ClientNotification;
				this.handler.handleNotification.call(this, notification);
				return;
			}
			default: {
				// @ts-expect-error unused
				const _exhaustiveCheck: never = message;
			}
		}
	}

	notify(notification: ServerNotification): void {
		this.port.postMessage({
			type: 'notification',
			data: notification,
		} as ServerMessage);
	}
}
