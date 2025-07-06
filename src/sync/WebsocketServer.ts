import { clientMessageSpec } from './ClientMessage';
import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import type { ClientMessageHandler, Server } from './Server';
import type { ServerMessage } from './ServerMessage';
import type { ServerNotification } from './ServerNotification';

export class WebsocketServer implements Server, Disposable {
	private port: WebSocket;
	private handler: ClientMessageHandler;

	constructor(port: WebSocket, handler: ClientMessageHandler) {
		this.port = port;
		this.handler = handler;

		this.port.addEventListener('message', this.#handleMessage);
		this.port.addEventListener('open', () => this.trySend());
	}

	[Symbol.dispose]() {
		this.port.removeEventListener('message', this.#handleMessage);
	}

	#handleMessage = (event: MessageEvent): void => {
		this.handleMessageData(event.data);
	};

	private sendQueue: string[] = [];
	private send(message: ServerMessage): void {
		this.sendQueue.push(JSON.stringify(message));
		this.trySend();
	}
	private trySend() {
		if (this.port.readyState === WebSocket.OPEN) {
			while (this.sendQueue.length > 0)
				this.port.send(this.sendQueue.shift()!);
		}
	}

	private async handleMessageData(data: unknown): Promise<void> {
		if (typeof data !== 'string') {
			console.error('Received non-string data:', data);
			return;
		}
		data = JSON.parse(data);
		if (typeof data !== 'object' || data === null) {
			console.error('Received non-object data:', data);
			return;
		}
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

				this.send({
					type: 'response',
					data: {
						id,
						response,
					},
				});
				return;
			}
			case 'notification': {
				const notification = message.data as ClientNotification;
				this.handler.handleNotification.call(this, notification);
				return;
			}
			case 'system-message': {
				const systemMessage = message.data;
				if (this.handler.handleSystemMessage) {
					this.handler.handleSystemMessage.call(this, systemMessage);
				} else {
					console.warn(
						'Received system message but no handler is defined',
						systemMessage,
					);
				}
				return;
			}
			default: {
				// @ts-expect-error unused
				const _exhaustiveCheck: never = message;
			}
		}
	}

	notify(notification: ServerNotification): void {
		this.send({
			type: 'notification',
			data: notification,
		});
	}
}
