import type { Client, ServerMessageHandler } from './Client';
import type { ServerNotification } from './host-message/ServerNotification';
import type { ClientRequest } from './member-message/ClientRequest';

import { serverMessageSpec } from './host-message/ServerMessage';
import type { ServerResponse } from './host-message/ServerResponse';
import type { ClientMessage } from './member-message/ClientMessage';
import type { ClientNotification } from './member-message/ClientNotification';

export class WebsocketClient implements Client, Disposable {
	private port: WebSocket;
	private messageHandler: ServerMessageHandler;
	private pendingResponses: Map<
		string,
		{
			resolve: (response: ServerResponse) => void;
			reject: (error: unknown) => void;
		}
	> = new Map();

	constructor(port: WebSocket, messageHandler: ServerMessageHandler) {
		this.port = port;
		this.messageHandler = messageHandler;

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
	private send(message: ClientMessage): void {
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
		const parsedData = serverMessageSpec.safeParse(data);
		if (!parsedData.success) {
			console.error('Invalid message data received:', data);
			return;
		}
		const message = parsedData.data;
		switch (message.type) {
			case 'notification': {
				const notification = message.data as ServerNotification;
				this.messageHandler.handleNotification.call(this, notification);
				return;
			}
			case 'response': {
				const { id, response } = message.data;
				const pending = this.pendingResponses.get(id);
				if (pending) {
					pending.resolve(response as ServerResponse);
				} else {
					console.error(`No pending response found for id: ${id}`);
				}
				return;
			}

			default: {
				// @ts-expect-error unused
				const _exhaustiveCheck: never = message;
			}
		}
	}

	async request(request: ClientRequest): Promise<ServerResponse> {
		const id = crypto.randomUUID();

		let resolve!: (response: ServerResponse) => void;
		let reject!: (error: unknown) => void;

		const promise = new Promise<ServerResponse>((res, rej) => {
			resolve = res;
			reject = rej;
		});

		this.pendingResponses.set(id, { resolve, reject });
		this.send({
			type: 'request',
			data: { id, request },
		});

		return promise.finally(() => {
			this.pendingResponses.delete(id);
		});
	}

	notify(notification: ClientNotification): void {
		this.send({
			type: 'notification',
			data: notification,
		});
	}
}
