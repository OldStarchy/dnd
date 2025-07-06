import type { Client, ServerMessageHandler } from './Client';
import type { ClientRequest } from './ClientRequest';
import type { ServerNotification } from './ServerNotification';

import type { ClientMessage } from './ClientMessage';
import type { ClientNotification } from './ClientNotification';
import { serverMessageSpec } from './ServerMessage';
import type { ServerResponse } from './ServerResponse';

export class MessagePortClient implements Client, Disposable {
	private port: MessagePort;
	private messageHandler: ServerMessageHandler;
	private pendingResponses: Map<
		string,
		{
			resolve: (response: ServerResponse) => void;
			reject: (error: unknown) => void;
		}
	> = new Map();

	constructor(port: MessagePort, messageHandler: ServerMessageHandler) {
		this.port = port;
		this.messageHandler = messageHandler;

		this.port.addEventListener('message', this.#handleMessage);
	}

	[Symbol.dispose]() {
		this.port.removeEventListener('message', this.#handleMessage);
	}

	#handleMessage = (event: MessageEvent): void => {
		this.handleMessageData(event.data);
	};

	private async handleMessageData(data: unknown): Promise<void> {
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
		this.port.postMessage({
			type: 'request',
			data: { id, request },
		} as ClientMessage);

		return promise.finally(() => {
			this.pendingResponses.delete(id);
		});
	}

	notify(notification: ClientNotification): void {
		this.port.postMessage({
			type: 'notification',
			data: notification,
		} as ClientMessage);
	}
}
