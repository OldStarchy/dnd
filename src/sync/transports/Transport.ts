import type { BehaviorSubject, Observable } from 'rxjs';

export type TransportState = (typeof TransportState.values)[number];

export namespace TransportState {
	export const CONNECTING = 'connecting';
	export const OPEN = 'open';
	export const CLOSED = 'closed';

	export const values = [CONNECTING, OPEN, CLOSED] as const;

	export function fromWebSocketReadyState(
		readyState: number,
	): TransportState {
		switch (readyState) {
			case WebSocket.CONNECTING:
				return 'connecting';
			case WebSocket.OPEN:
				return 'open';
			default:
				return 'closed';
		}
	}
}

export interface Transport<Send, Receive> {
	send(data: Send): Promise<void>;
	message$: Observable<Receive>;

	readonly state$: BehaviorSubject<TransportState>;
}

export interface ClosableTransport<Send, Receive>
	extends Transport<Send, Receive> {
	close(): void;
}

export interface Sink<Send> {
	send(data: Send): Promise<void>;

	readonly state: TransportState;
}
