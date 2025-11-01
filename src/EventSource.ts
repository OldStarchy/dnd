interface ReconnectingPortEventMap<T> {
	message: MessageEvent<T>;
	messageerror: MessageEvent;
	connected: Event;
	disconnected: Event;
}

interface ReconnectingPort<T> {
	postMessage(message: T): void;
	addEventListener<K extends keyof ReconnectingPortEventMap<T>>(
		type: K,
		listener: (this: ReconnectingPort<T>, ev: ReconnectingPortEventMap<T>[K]) => any,
		options?: {signal?: AbortSignal}
	): void;
}

interface BaseEvent {
	id: string;
	type: string;
	timestamp: number;
	source: {clientId: string;};
	context?: Record<string, any>;
}

class EventSource<E extends BaseEvent, State> {
	private static readonly SNAPSHOT_INTERVAL = 100;

	protected events: E[] = [];
	protected subscribers: ((state: State) => void)[] = [];
	protected state: State;

	// Snapshot of state just after eventIndex
	protected snapshots: {state: State; eventIndex: number;}[] = [];

	constructor(
		private initialState: Readonly<State>,
		protected readonly applyEvent: (state: Readonly<State>, event: E) => State,
	) {
		this.state = initialState;
	}

	getState(): Readonly<State> {
		return this.state;
	}

	subscribe(callback: (state: State) => void): () => void {
		const safeCallback = (state: State) => {
			try {
				callback(state);
			} catch (e) {
				console.error('Error in subscriber callback:', e);
			}
		}
		this.subscribers.push(safeCallback);
		safeCallback(this.state);

		return () => {
			const i = this.subscribers.indexOf(safeCallback);
			if (i !== -1) this.subscribers.splice(i, 1);
		}
	}

	protected dispatch(event: E): void {
		this.events.push(event);
		this.state = this.applyEvent(this.state, event);
		this.notify();

		const latestSnapshot = this.getLatestSnapshot();

		if (this.events.length - latestSnapshot.eventIndex - 1 >= EventSource.SNAPSHOT_INTERVAL) {
			this.createSnapshot();
		}
	}

	protected notify(): void {
		for (const subscriber of [...this.subscribers]) {
			subscriber(this.state);
		}
	}

	replay(events: E[]): void {
		for (const event of events) {
			this.state = this.applyEvent(this.state, event);
		}
		this.notify();
	}

	protected generateEventId(): string {
		// return v4();
		return Math.random().toString(36).substring(2);
	}

	protected createSnapshot(): () => void {
		const snapshot = {state: this.state, eventIndex: this.events.length - 1}
		this.snapshots.push(snapshot);

		return () => {
			const i = this.snapshots.indexOf(snapshot);
			if (i !== -1) this.snapshots.splice(i, 1);
		}
	}

	protected removeEvent(event: E): void {
		const index = this.events.findIndex(e => e.id === event.id);
		if (index === -1) return;

		while (this.getLatestSnapshot().eventIndex >= index) {
			this.dropLatestSnapshot();
		}

		const snapshot = this.getLatestSnapshot();

		const eventsToReplay = this.events.splice(snapshot.eventIndex + 1).filter(e => e.id !== event.id);

		this.state = snapshot.state;
		this.replay(eventsToReplay);
	}

	protected getLatestSnapshot(): {state: State; eventIndex: number;} {
		if (this.snapshots.length === 0) {
			return {state: this.initialState, eventIndex: -1};
		}
		return this.snapshots[this.snapshots.length - 1];
	}

	protected dropLatestSnapshot(): void {
		if (this.snapshots.length === 0) return;
		this.snapshots.pop();
	}

	private rollbackToSnapshotSilent(): E[] {
		const snapshot = this.getLatestSnapshot();
		this.state = snapshot.state;
		const removedEvents = this.events.splice(snapshot.eventIndex + 1);

		return removedEvents;
	}

	protected insertEvents(events: E[]): void {
		if (events.length === 0) return;

		const firstNewEventTimestamp = events[0]!.timestamp;
		const postEventIndex = this.events.findIndex(e => e.timestamp > firstNewEventTimestamp);
		const insertIndex = postEventIndex === -1 ? this.events.length : postEventIndex;

		this.dropSnapshotsAfterEventIndex(insertIndex);

		const existingEvents = this.rollbackToSnapshotSilent();
		const newEvents: E[] = mergeSorted(
			existingEvents,
			events,
			(a, b) =>
				a.timestamp !== b.timestamp
					? a.timestamp - b.timestamp
					: a.id.localeCompare(b.id)
		);

		this.replay(newEvents);
	}

	private dropSnapshotsAfterEventIndex(eventIndex: number): void {
		while (this.getLatestSnapshot().eventIndex >= eventIndex) {
			this.dropLatestSnapshot();
		}
	}


	protected rebaseline(state: State): void {
		this.initialState = state;
		this.events = [];
		this.snapshots = [];
		this.state = state;
		this.notify();
	}
}

function mergeSorted<T>(left: T[], right: T[], compare: (a: T, b: T) => number): T[] {
	let i = 0, j = 0;
	const result: T[] = [];

	while (i < left.length && j < right.length) {
		if (compare(left[i]!, right[j]!) <= 0) result.push(left[i++]!);
		else result.push(right[j++]!);
	}

	return result.concat(left.slice(i), right.slice(j));
}

type EventMessage<E> = {
	type: 'event';
	event: E;
} | {
	type: 'rejection';
	eventId: string;
} | {
	type: 'requestHistory';
	since: number;
} | {
	type: 'eventHistory';
	events: E[];
}

class HostEventSource<E extends BaseEvent, State> extends EventSource<E, State> {
	private clients = new Map<string, {port: ReconnectingPort<EventMessage<E>>; dispose: () => void}>();
	private pastEventIds = new Set<string>();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: E) => State,
		private validate: (event: Omit<E, 'timestamp' | 'source'>, clientId: string) => boolean,
		private filterForClient: (event: E, clientId: string) => E | null,
	) {
		super(initialState, applyEvent)
	}

	protected validateClientEvent(proposedEvent: Omit<E, 'timestamp' | 'source'>, clientId: string): boolean {
		if (this.pastEventIds.has(proposedEvent.id)) {
			console.warn(`Rejected duplicate event ID from client ${clientId}:`, proposedEvent.id);
			return false;
		}

		if (!this.validate(proposedEvent, clientId)) {
			console.warn(`Rejected event from client ${clientId}:`, proposedEvent);
			return false;
		}

		return true;
	}

	protected receiveFromClient(proposedEvent: Omit<E, 'timestamp' | 'source'>, clientId: string): void {
		if (!this.validateClientEvent(proposedEvent, clientId)) {
			this.sendRejectionToClient(proposedEvent.id, clientId);
			return;
		}

		const authoritativeEvent = {
			...proposedEvent,
			timestamp: Date.now(),
			source: {clientId},
		} as E;

		this.pastEventIds.add(authoritativeEvent.id);

		this.dispatch(authoritativeEvent);
		this.broadcast(authoritativeEvent);
	}

	private broadcast(authoritativeEvent: E): void {
		for (const [otherClientId, client] of this.clients.entries()) {
			const filtered = this.filterForClient(authoritativeEvent, otherClientId);

			if (filtered) client.port.postMessage({
				type: 'event',
				event: filtered
			});
		}
	}

	private sendRejectionToClient(eventId: string, clientId: string): void {
		const client = this.clients.get(clientId);

		if (client) {
			client.port.postMessage({
				type: 'rejection',
				eventId,
			});
		}
	}

	addClient(clientId: string, port: ReconnectingPort<EventMessage<E>>): void {
		const abortController = new AbortController();

		const dispose = () => abortController.abort();

		port.addEventListener('message', (event) => {
			const data = event.data;
			switch (data.type) {
				case 'event':
					this.receiveFromClient(data.event, clientId);
					break;

				case 'requestHistory': {
					const since = data.since;
					const eventsToSend = this.events.filter(e => e.timestamp > since).map(e => {
						const filtered = this.filterForClient(e, clientId);
						return filtered;
					}).filter((e): e is E => e !== null);

					port.postMessage({
						type: 'eventHistory',
						events: eventsToSend,
					});
					break;
				}
			}
		}, {signal: abortController.signal});

		this.clients.set(clientId, {
			port,
			dispose,
		});
	}

	removeClient(clientId: string): void {
		const client = this.clients.get(clientId);
		if (client) {
			client.dispose();
			this.clients.delete(clientId);
		}
	}

}

class ClientEventSource<E extends BaseEvent, State> extends EventSource<E, State> {
	private static readonly PROPOSED_EVENT_RETRY_TIMEOUT = 5000; // 5 seconds

	private pending: Map<string, E> = new Map();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: E) => State,
		private port: ReconnectingPort<EventMessage<E>>,
	) {
		super(initialState, applyEvent);

		this.port.addEventListener('message', (event) => {
			const data = event.data;
			if (data.type === 'event') {
				this.receiveFromHost(data.event);
			} else if (data.type === 'rejection') {
				this.rejectPendingEvent(data.eventId);
			} else if (data.type === 'eventHistory') {
				this.insertEvents(data.events);
			}
		});

		this.port.addEventListener('connected', () => {
			// Resend pending events
			for (const event of this.pending.values()) {
				this.sendToHost(event);
			}

			const latestTimestamp = this.events[this.events.length - 1]?.timestamp || 0;
			this.requestEventHistory(latestTimestamp);
		});
	}

	propose(eventData: Omit<E, 'id' | 'timestamp' | 'source'>): void {
		const proposedEvent = {
			...eventData,
			id: this.generateEventId(),
			timestamp: Date.now(),
		} as E;

		this.pending.set(proposedEvent.id, proposedEvent);
		this.dispatch(proposedEvent);

		this.sendToHost(proposedEvent);

		const retry = () => {
			if (this.pending.has(proposedEvent.id)) {
				this.sendToHost(proposedEvent);
			}

			setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
		};

		setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
	}

	protected receiveFromHost(event: E): void {
		this.pending.delete(event.id);
		this.dispatch(event);
	}

	protected rejectPendingEvent(eventId: string): void {
		const rejectedEvent = this.pending.get(eventId);
		if (!rejectedEvent) return;
		this.pending.delete(eventId);

		this.removeEvent(rejectedEvent);
	}

	private sendToHost(event: E): void {
		this.port.postMessage({
			type: 'event',
			event,
		});
	}

	private requestEventHistory(sinceTimestamp: number): void {
		this.port.postMessage({
			type: 'requestHistory',
			since: sinceTimestamp,
		});
	}
}

export { }
