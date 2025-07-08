import type { Transport, TransportHandler } from '../Transport';

export class PortTransport implements Transport<string> {
	private port: MessagePort;
	private open = true;
	private closeHandler?: () => void;
	private messageHandler: (message: string) => void;

	constructor(port: MessagePort, handler: TransportHandler<string>) {
		this.port = port;
		this.port.addEventListener('message', this.#handleMessage);

		this.messageHandler = handler.handleMessage.bind(this);
		this.closeHandler = handler.handleClose.bind(this);

		this.port.start();
		handler.handleOpen.call(this);
	}

	#handleMessage = (event: MessageEvent): void => {
		if (typeof event.data !== 'string') {
			console.warn('Received non-string message:', event.data);
			return;
		}
		this.messageHandler(event.data);
	};

	/**
	 * MessagePort doesn't have a reliable way to check if it's open,
	 * so we assume it's always open once created.
	 */
	isOpen(): boolean {
		return this.open;
	}

	send(data: string): Promise<void> {
		if (!this.open) {
			return Promise.reject(new Error('Transport is closed'));
		}
		this.port.postMessage(data);
		return Promise.resolve();
	}

	close(): void {
		this.open = false;
		this.port.close();
		this.port.removeEventListener('message', this.#handleMessage);
		this.port = null as unknown as MessagePort;

		this.closeHandler?.call(this);
		this.closeHandler = undefined;
	}

	[Symbol.dispose](): void {
		this.close();
	}
}
