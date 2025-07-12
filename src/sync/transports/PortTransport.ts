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
		try {
			handler.handleOpen.call(this);
		} catch (error) {
			console.error('Error in handleOpen:', error);
		}
	}

	#handleMessage = (event: MessageEvent): void => {
		if (typeof event.data !== 'string') {
			console.warn('Received non-string message:', event.data);
			return;
		}
		try {
			this.messageHandler(event.data);
		} catch (error) {
			console.error('Error in handleMessage:', error);
		}
	};

	/**
	 * MessagePort doesn't have a reliable way to check if it's open,
	 * so we assume it's open once created until we call close.
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
		if (!this.open) {
			return; // Already closed
		}

		this.open = false;

		if (this.port) {
			this.port.removeEventListener('message', this.#handleMessage);
			this.port.close();
			this.port = null as unknown as MessagePort;
		}

		if (this.closeHandler) {
			try {
				this.closeHandler.call(this);
			} catch (error) {
				console.error('Error in handleClose:', error);
			}
			this.closeHandler = undefined;
		}
	}

	[Symbol.dispose](): void {
		this.close();
	}
}
