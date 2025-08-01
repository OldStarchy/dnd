import { Subject } from 'rxjs';
import type { Transport } from '../Transport';

export class PortTransport implements Transport<string> {
	private port: MessagePort;
	private open = true;

	private _message$ = new Subject<string>();
	readonly message$ = this._message$.asObservable();
	constructor(port: MessagePort) {
		this.port = port;
		this.port.addEventListener('message', this.#handleMessage);

		this.port.start();
	}

	#handleMessage = (event: MessageEvent): void => {
		if (typeof event.data !== 'string') {
			console.warn('Received non-string message:', event.data);
			return;
		}
		try {
			this._message$.next(event.data);
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
	}

	[Symbol.dispose](): void {
		this.close();
	}
}
