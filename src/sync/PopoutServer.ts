import type { ClientNotification } from './ClientNotification';
import type { ClientRequest } from './ClientRequest';
import { MessagePortServer } from './MessagePortServer';
import type { ClientMessageHandler, Server } from './Server';
import type { ServerNotification } from './ServerNotification';
import type { ServerResponse } from './ServerResponse';

type TypedServer = Server<Exclude<ServerNotification, { type: 'heartbeat' }>>;

type TypedClientMessageHandler = ClientMessageHandler<
	ClientRequest,
	ServerResponse,
	Exclude<ClientNotification, { type: 'heartbeat' }>,
	Exclude<ServerNotification, { type: 'heartbeat' }>
>;
export default class PopoutServer implements TypedServer, Disposable {
	private messageHandler: TypedClientMessageHandler;
	private inner: MessagePortServer | null = null;
	private window: Window | null = null;

	constructor(messageHandler: TypedClientMessageHandler) {
		this.messageHandler = messageHandler;

		window.addEventListener('message', this.#handleWindowMessage);
	}

	[Symbol.dispose]() {
		this.inner?.[Symbol.dispose]();
		this.inner = null;
		window.removeEventListener('message', this.#handleWindowMessage);
		this.window?.close();
		this.window = null;
	}

	#handleWindowMessage = (event: MessageEvent): void => {
		if (event.data === 'POPUP_READY') {
			this.window = event.source as Window;
			this.prepareWindow(this.window);
		}
	};

	open() {
		if (this.window && !this.window.closed) {
			this.window.focus();

			if (this.window.location.pathname !== '/popout') {
				this.window.location.href = '/popout';
			}
			return;
		}

		const win = window.open('/popout', 'popout', 'width=800,height=600');
		if (!win) {
			console.error('Failed to open popout window');
			return;
		}

		win.addEventListener('load', () => {
			this.prepareWindow(win);
		});

		this.window = win;
	}

	close() {
		if (this.window && !this.window.closed) {
			this.window.close();
			this.window = null;
		}
		this.inner?.[Symbol.dispose]();
		this.inner = null;
	}

	isOpen(): boolean {
		return (
			this.window !== null && !this.window.closed && this.inner !== null
		);
	}

	private prepareWindow(win: Window): void {
		this.inner?.[Symbol.dispose]();

		const channel = new MessageChannel();
		const { port1, port2 } = channel;

		win.postMessage(
			{ type: 'INIT_PORT', port: port2 },
			{ transfer: [port2] },
		);

		port1.start();

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;

		this.inner = new MessagePortServer(port1, {
			...this.messageHandler,
			handleNotification(notification) {
				switch (notification.type) {
					case 'heartbeat':
						this.notify({ type: 'heartbeat' });
						console.log('Heartbeat returned');
						return;
					default:
						self.messageHandler.handleNotification.call(
							this,
							notification,
						);
				}
			},
		});
	}

	notify(notification: ServerNotification): void {
		if (!this.inner) {
			throw new Error('Server is not initialized');
		}

		this.inner.notify(notification);
	}
}
