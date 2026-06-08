import type { ReconnectingPort, ReconnectingPortEventMap } from '../ReconnectingPort';

export class MockPort<T> implements ReconnectingPort<T> {
	private listeners: {
		[K in keyof ReconnectingPortEventMap<T>]?: ((
			this: ReconnectingPort<T>,
			ev: ReconnectingPortEventMap<T>[K],
		) => unknown)[];
	} = {};

	public sentMessages: T[] = [];

	postMessage(message: T): void {
		this.sentMessages.push(message);
	}

	addEventListener<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		listener: (this: ReconnectingPort<T>, ev: ReconnectingPortEventMap<T>[K]) => unknown,
		_options?: { signal?: AbortSignal },
	): void {
		if (!this.listeners[type]) {
			this.listeners[type] = [];
		}
		this.listeners[type].push(listener);
	}

	async simulateReceivedEvent<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		event: ReconnectingPortEventMap<T>[K],
	): Promise<void> {
		this.listeners[type]?.forEach((listener) => listener.call(this, event));

		await new Promise<void>((r) => setTimeout(() => r(), 0));
	}
}
