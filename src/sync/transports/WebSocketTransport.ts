import type { Transport, TransportHandler } from '../Transport';

export type WebSocketData = string | ArrayBuffer | Blob;

export class WebSocketTransport implements Transport<WebSocketData> {
	private ws: WebSocket;
	private handler: TransportHandler<WebSocketData>;
	private closeHandler?: () => void;
	private messageHandler: (message: WebSocketData) => void;

	constructor(ws: WebSocket, handler: TransportHandler<WebSocketData>) {
		this.ws = ws;
		this.handler = handler;
		this.ws.addEventListener('message', this.#handleMessage);
		this.ws.addEventListener('open', this.#handleOpen);
		this.ws.addEventListener('close', this.#handleClose);
		this.ws.addEventListener('error', this.#handleError);

		this.messageHandler = handler.handleMessage.bind(this);
		this.closeHandler = handler.handleClose.bind(this);

		// If the WebSocket is already open, handle it immediately
		if (this.ws.readyState === WebSocket.OPEN) {
			try {
				handler.handleOpen.call(this);
			} catch (error) {
				console.error('Error in handleOpen:', error);
			}
		}
	}

	#handleOpen = (): void => {
		try {
			this.handler.handleOpen.call(this);
		} catch (error) {
			console.error('Error in handleOpen:', error);
		}
	};

	#handleMessage = (event: MessageEvent): void => {
		const data = event.data;

		// WebSocket can receive string, ArrayBuffer, or Blob
		if (
			typeof data === 'string' ||
			data instanceof ArrayBuffer ||
			data instanceof Blob
		) {
			try {
				this.messageHandler(data);
			} catch (error) {
				console.error('Error in handleMessage:', error);
			}
		} else {
			console.warn(
				'Received unsupported message type:',
				typeof data,
				data,
			);
		}
	};

	#handleClose = (): void => {
		if (this.closeHandler) {
			try {
				this.closeHandler.call(this);
			} catch (error) {
				console.error('Error in handleClose:', error);
			}
		}
	};

	#handleError = (event: Event): void => {
		console.error('WebSocket error:', event);
	};

	isOpen(): boolean {
		return this.ws.readyState === WebSocket.OPEN;
	}

	send(data: WebSocketData): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.isOpen()) {
				reject(new Error('WebSocket is not open'));
				return;
			}

			try {
				this.ws.send(data);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	close(): void {
		if (this.ws) {
			this.ws.removeEventListener('message', this.#handleMessage);
			this.ws.removeEventListener('open', this.#handleOpen);
			this.ws.removeEventListener('close', this.#handleClose);
			this.ws.removeEventListener('error', this.#handleError);

			if (
				this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING
			) {
				this.ws.close();
			}
		}

		this.closeHandler = undefined;
	}

	[Symbol.dispose](): void {
		this.close();
	}
}
