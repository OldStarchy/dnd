import { BehaviorSubject, Subject } from 'rxjs';

import trace from '@/decorators/trace';
import Logger from '@/lib/log';
import {
	type ClosableTransport,
	TransportState,
} from '@/sync/transports/Transport';

export type WebSocketData = Parameters<WebSocket['send']>[0];

export default class ReconnectingWebSocket
	implements ClosableTransport<WebSocketData, WebSocketData>
{
	private socket: { socket: WebSocket; abort: AbortController } | null = null;
	private connectTimeout: number | ((attemptNumber: number) => number);
	private attemptNumber: number;

	readonly state$ = new BehaviorSubject<TransportState>(
		TransportState.CONNECTING,
	);

	#message$ = new Subject<WebSocketData>();
	message$ = this.#message$.asObservable();

	constructor(
		private url: string | URL,
		{
			connectTimeout = 5000,
		}: {
			connectTimeout?: number | ((attemptNumber: number) => number);
		} = {},
	) {
		this.connectTimeout = connectTimeout;
		this.attemptNumber = 0;

		this.tryConnect();
	}

	private getConnectTimeout() {
		if (this.connectTimeout instanceof Function) {
			return this.connectTimeout(this.attemptNumber);
		}

		return this.connectTimeout;
	}

	private disposeSocket(socket: WebSocket) {
		if (socket === this.socket?.socket) {
			this.socket.abort.abort();
			// This will trigger an error in chrome but that is a bug
			this.socket.socket.close();
			this.socket = null;
		}
	}

	private updateState(readyState: number) {
		const newState = TransportState.fromWebSocketReadyState(readyState);
		if (newState !== this.state$.value) {
			this.state$.next(newState);
		}
	}

	@trace(Logger.INFO)
	private tryConnect() {
		if (this.socket)
			throw new Error('tryConnect called when socket was already set');

		const abort = new AbortController();
		const socket = new WebSocket(this.url);
		const timeoutDuration = this.getConnectTimeout();
		this.attemptNumber++;

		this.socket = { socket, abort };

		let timeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
			this.disposeSocket(socket);

			this.tryConnect();
		}, timeoutDuration);

		const cancelTimeout = () => {
			if (timeout) clearTimeout(timeout);
			timeout = null;
		};

		socket.addEventListener(
			'open',
			() => {
				cancelTimeout();

				this.attemptNumber = 0;
				this.updateState(socket.readyState);
			},
			abort,
		);

		socket.addEventListener(
			'error',
			(_event) => {
				cancelTimeout();
				this.disposeSocket(socket);

				this.tryConnect();
				this.updateState(socket.readyState);
			},
			abort,
		);

		socket.addEventListener(
			'close',
			(event) => {
				cancelTimeout();
				this.disposeSocket(socket);

				// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value

				// Normal Closure
				// TODO: 1005 is a bug in the server, it should be 1000
				// Tracked by https://github.com/OldStarchy/dnd_host/issues/4
				if (event.code === 1000 || event.code === 1005) {
					this.updateState(socket.readyState);
					return;
				}

				this.tryConnect();
			},
			abort,
		);

		socket.addEventListener(
			'message',
			(event) => {
				this.#message$.next(event.data);
			},
			abort,
		);
	}

	send(data: WebSocketData): Promise<void> {
		if (this.socket) {
			this.socket.socket.send(data);
			return Promise.resolve();
		}

		return Promise.reject(new Error('Not connected'));
	}

	close() {
		if (this.socket) {
			this.disposeSocket(this.socket.socket);
			this.updateState(WebSocket.CLOSED);
		}
	}
}
