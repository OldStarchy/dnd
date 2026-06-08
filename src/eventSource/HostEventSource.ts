import createUid from '../lib/createUid';
import type { BaseEvent } from './BaseEvent';
import type { EventMessage } from './EventMessage';
import { EventSource } from './EventSource';
import type { ReconnectingPort } from './ReconnectingPort';

interface Client<EventPayload> extends Disposable {
	port: ReconnectingPort<EventMessage<EventPayload>>;
}

export default class HostEventSource<EventPayload, State> extends EventSource<EventPayload, State> {
	constructor(
		initialState: State,
		applyEvent: (state: State, event: EventPayload) => State,
		private validate: (
			event: { id: string; payload: EventPayload },
			clientId: string,
		) => Promise<boolean>,
		private filterForClient: (event: EventPayload, clientId: string) => EventPayload | null,
	) {
		super(initialState, applyEvent);
	}

	/**
	 * Immediately dispatch a new event.
	 */
	dispatch(payload: EventPayload): void {
		const event: BaseEvent<EventPayload> = {
			id: createUid(),
			source: { clientId: 'host' },
			timestamp: Date.now(),
			context: undefined,
			payload,
		};

		this.dispatchEvent(event);
	}

	protected override dispatchEvent(event: BaseEvent<EventPayload>): void {
		this.pastEventIds.add(event.id);

		super.dispatchEvent(event);
		this.broadcast(event);
	}

	addClient(clientId: string, port: ReconnectingPort<EventMessage<EventPayload>>): void {
		const abortController = new AbortController();

		port.addEventListener(
			'message',
			(event) => {
				const data = event.data;
				switch (data.type) {
					case 'proposeEvent':
						void this.receiveFromClient(
							{
								id: data.id,
								payload: data.payload,
							},
							clientId,
						);
						break;

					case 'requestHistory': {
						const since = data.since;
						const eventsToSend = this.getEvents()
							.filter((e) => e.timestamp > since)
							.map((e): BaseEvent<EventPayload> | null => {
								const filtered = this.filterForClient(e.payload, clientId);
								if (filtered !== null)
									return {
										...e,
										payload: filtered,
									};
								return null;
							})
							.filter((e): e is BaseEvent<EventPayload> => e !== null);

						port.postMessage({
							type: 'eventHistory',
							events: eventsToSend,
						});
						break;
					}

					default:
						console.warn(`Unknown message type from client ${clientId}:`, data);
						break;
				}
			},
			{ signal: abortController.signal },
		);

		this.clients.set(clientId, {
			port,
			[Symbol.dispose]() {
				abortController.abort();
			},
		});
	}

	removeClient(clientId: string): void {
		const client = this.clients.get(clientId);
		if (client) {
			client[Symbol.dispose]();
			this.clients.delete(clientId);
		}
	}

	protected async validateClientEvent(
		proposedEvent: Omit<BaseEvent<EventPayload>, 'timestamp' | 'source'>,
		clientId: string,
	): Promise<boolean> {
		if (this.pastEventIds.has(proposedEvent.id)) {
			console.warn(`Rejected duplicate event ID from client ${clientId}:`, proposedEvent.id);
			return false;
		}

		if (!(await this.validate(proposedEvent, clientId))) {
			console.warn(`Rejected event from client ${clientId}:`, proposedEvent);
			return false;
		}

		return true;
	}

	protected async receiveFromClient(
		proposedEvent: { id: string; payload: EventPayload },
		clientId: string,
	): Promise<void> {
		if (!(await this.validateClientEvent(proposedEvent, clientId))) {
			this.sendRejectionToClient(proposedEvent.id, clientId);
			return;
		}

		const authoritativeEvent: BaseEvent<EventPayload> = {
			...proposedEvent,
			timestamp: Date.now(),
			source: { clientId },
		};

		this.dispatchEvent(authoritativeEvent);
	}

	private broadcast(authoritativeEvent: BaseEvent<EventPayload>): void {
		for (const [otherClientId, client] of this.clients.entries()) {
			const filtered = this.filterForClient(authoritativeEvent.payload, otherClientId);

			if (filtered)
				client.port.postMessage({
					type: 'event',
					event: {
						...authoritativeEvent,
						payload: filtered,
					},
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

	private clients = new Map<string, Client<EventPayload>>();
	private pastEventIds = new Set<string>();
}
