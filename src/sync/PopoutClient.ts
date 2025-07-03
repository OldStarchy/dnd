import type { Client, ServerMessageHandler } from './Client';
import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import { MessagePortClient } from './MessagePortClient';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

type TypedClient = Client<
	ClientRequest,
	ServerResponse,
	Exclude<ClientNotification, { type: 'heartbeat' }>
>;

type TypedServerMessageHandler = ServerMessageHandler<
	ClientRequest,
	ServerResponse,
	Exclude<ClientNotification, { type: 'heartbeat' }>,
	Exclude<ServerNotification, { type: 'heartbeat' }>
>;

export class PopoutClient implements TypedClient, Disposable {
	private messageHandler: TypedServerMessageHandler;
	private inner: MessagePortClient | null;
	private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
	private heartbeats: number = 0;

	constructor(messageHandler: TypedServerMessageHandler) {
		this.messageHandler = messageHandler;
		this.inner = null;

		window.addEventListener('message', this.#handleMessage);
		window.opener?.postMessage('POPUP_READY');

		this.heartbeatInterval = setInterval(() => {
			if (this.inner) {
				this.inner.notify({ type: 'heartbeat' });
				this.heartbeats += 1;
				console.log('Heartbeat sent, count: ', this.heartbeats);
				if (this.heartbeats === 5) {
					window.opener?.postMessage('POPUP_READY');
				}
				if (this.heartbeats > 10) {
					console.warn('Heartbeat timeout, closing popout window');
					this.onConnectionTimeout?.();
				}
			}
		}, 1000);
	}

	public onConnectionTimeout?: () => void;

	[Symbol.dispose]() {
		window.removeEventListener('message', this.#handleMessage);
		this.inner?.[Symbol.dispose]();
		this.inner = null;
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}

	#handleMessage = (event: MessageEvent): void => {
		if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
			const port = event.ports[0];
			port.start();

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;

			this.inner?.[Symbol.dispose]();
			this.inner = new MessagePortClient(port, {
				...this.messageHandler,
				handleNotification(notification) {
					switch (notification.type) {
						case 'heartbeat': {
							self.heartbeats = 0;
							console.log('Heartbeat received');
							return;
						}
						default: {
							self.messageHandler.handleNotification.call(
								this,
								notification,
							);
						}
					}
				},
			});
			this.inner.notify({ type: 'ready' });
		}
	};

	notify(notification: ClientNotification): void {
		if (!this.inner) {
			throw new Error('Client is not initialized');
		}

		return this.inner.notify(notification);
	}

	request(request: ClientRequest): Promise<ServerResponse> {
		if (!this.inner) {
			throw new Error('Client is not initialized');
		}

		return this.inner.request(request);
	}
}
