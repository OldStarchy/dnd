import { Subject } from 'rxjs';
import type { ClosableTransport, TransportState } from './Transport';

export type WebSocketData = Parameters<WebSocket['send']>[0];

export class WebSocketTransport
	implements ClosableTransport<WebSocketData, WebSocketData>
{
	get state(): TransportState {
		return this.ws.readyState === WebSocket.OPEN ? 'open' : 'closed';
	}

	private ws: WebSocket;
	private _message$ = new Subject<WebSocketData>();
	readonly message$ = this._message$.asObservable();

	constructor(ws: WebSocket) {
		this.ws = ws;
		this.ws.addEventListener('message', this.#handleMessage);
		this.ws.addEventListener('close', this.#handleClose);
		this.ws.addEventListener('error', this.#handleError);
	}

	#handleMessage = (event: MessageEvent<WebSocketData>): void => {
		this._message$.next(event.data);
	};

	#handleClose = (): void => {
		this._message$.complete();
	};

	#handleError = (event: Event): void => {
		this._message$.error(event);
	};

	send(data: WebSocketData): Promise<void> {
		if (this.state !== 'open') {
			return Promise.reject(new Error('WebSocket is not open'));
		}

		try {
			this.ws.send(data);
			return Promise.resolve();
		} catch (error) {
			return Promise.reject(error);
		}
	}

	close(): void {
		this.ws.removeEventListener('message', this.#handleMessage);
		this.ws.removeEventListener('close', this.#handleClose);
		this.ws.removeEventListener('error', this.#handleError);

		if (
			this.ws.readyState === WebSocket.OPEN ||
			this.ws.readyState === WebSocket.CONNECTING
		) {
			this.ws.close();
		}
	}
}
