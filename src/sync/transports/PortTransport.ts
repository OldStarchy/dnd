import { BehaviorSubject, Subject } from 'rxjs';
import { TransportState, type ClosableTransport } from './Transport';

export class PortTransport implements ClosableTransport<unknown, unknown> {
	private port: MessagePort;

	readonly state$ = new BehaviorSubject<TransportState>(TransportState.OPEN);

	private _message$ = new Subject<unknown>();
	readonly message$ = this._message$.asObservable();
	constructor(port: MessagePort) {
		this.port = port;
		this.port.addEventListener('message', this.#handleMessage);

		this.port.start();
	}

	#handleMessage = (event: MessageEvent): void => {
		this._message$.next(event.data);
	};

	send(data: unknown): Promise<void> {
		if (this.state$.value !== 'open') {
			return Promise.reject(new Error('Transport is closed'));
		}
		this.port.postMessage(data);
		return Promise.resolve();
	}

	close(): void {
		if (this.state$.value === 'closed') {
			return; // Already closed
		}

		this.state$.next('closed');

		if (this.port) {
			this.port.removeEventListener('message', this.#handleMessage);
			this.port.close();
			this.port = null as unknown as MessagePort;
		}
	}
}
