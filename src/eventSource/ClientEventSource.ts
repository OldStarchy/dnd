import createUid from '../lib/createUid';
import type { BaseEvent } from './BaseEvent';
import type { EventMessage } from './EventMessage';
import { EventSource } from './EventSource';
import type { Port } from './ReconnectingPort';

export default class ClientEventSource<EventPayload, State> extends EventSource<
	EventPayload,
	State
> {
	private static readonly PROPOSED_EVENT_RETRY_TIMEOUT = 5000; // 5 seconds

	private pending: Map<string, BaseEvent<EventPayload>> = new Map();

	constructor(
		initialState: State,
		applyEvent: (state: State, event: EventPayload) => State,
		private port: Port<EventMessage<EventPayload>>,
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
				this.sendToHost(event.id, event.payload);
			}

			const latestTimestamp = this.getEvents().at(-1)?.timestamp || 0;
			this.requestEventHistory(latestTimestamp);
		});
	}

	propose(eventData: EventPayload): void {
		const proposedEvent: BaseEvent<EventPayload> = {
			id: createUid(),
			timestamp: Date.now(),
			source: { clientId: 'self' },
			payload: eventData,
		};

		this.pending.set(proposedEvent.id, proposedEvent);
		this.dispatchEvent(proposedEvent);

		this.sendToHost(proposedEvent.id, proposedEvent.payload);

		const retry = () => {
			if (this.pending.has(proposedEvent.id)) {
				this.sendToHost(proposedEvent.id, proposedEvent.payload);
			}

			setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
		};

		setTimeout(retry, ClientEventSource.PROPOSED_EVENT_RETRY_TIMEOUT);
	}

	protected receiveFromHost(event: BaseEvent<EventPayload>): void {
		const pendingEvent = this.pending.get(event.id);

		if (pendingEvent) {
			this.pending.delete(event.id);
			this.replaceEvent(event);
		} else this.dispatchEvent(event);
	}

	protected rejectPendingEvent(eventId: string): void {
		const rejectedEvent = this.pending.get(eventId);
		if (!rejectedEvent) return;
		this.pending.delete(eventId);

		this.removeEvent(rejectedEvent);
	}

	private sendToHost(id: string, payload: EventPayload): void {
		this.port.postMessage({
			type: 'proposeEvent',
			id,
			payload,
		});
	}

	private requestEventHistory(sinceTimestamp: number): void {
		this.port.postMessage({
			type: 'requestHistory',
			since: sinceTimestamp,
		});
	}
}
