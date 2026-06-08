export interface PortEventMap<T> {
	message: MessageEvent<T>;
	messageerror: MessageEvent;
	connected: Event;
	disconnected: Event;
}
export interface Port<T> {
	postMessage(message: T): void;
	addEventListener<K extends keyof PortEventMap<T>>(
		type: K,
		listener: (this: Port<T>, ev: PortEventMap<T>[K]) => unknown,
		options?: { signal?: AbortSignal },
	): void;
}
