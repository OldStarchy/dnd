import { beforeEach, describe, expect, it } from 'vitest';
import createUid from '../lib/createUid';
import { applyEvent } from './__test/applyEvent';
import type { CounterState } from './__test/CounterState';
import { MockPort } from './__test/MockPort';
import type { TestEvent } from './__test/TestEvent';
import type { BaseEvent } from './BaseEvent';
import type { EventMessage } from './EventMessage';
import HostEventSource from './HostEventSource';

class TestHostEventSource extends HostEventSource<TestEvent, CounterState> {
	eventQueue: {
		data: { event: Omit<BaseEvent<TestEvent>, 'timestamp' | 'source'>; clientId: string };
		resolve: (ok: boolean) => void;
	}[] = [];

	constructor() {
		super(
			{ count: 0 },
			applyEvent,
			async (event, clientId) => {
				let resolve: (ok: boolean) => void;
				const promise = new Promise<boolean>((res) => {
					resolve = res;
				});
				// oxlint-disable-next-line typescript/no-non-null-assertion
				this.eventQueue.push({ data: { event, clientId }, resolve: resolve! });
				return promise;
			},
			(event) => event,
		);
	}

	async handleNextProposedEvent(
		validator: (event: { id: string; payload: TestEvent }, clientId: string) => boolean,
	) {
		const event = this.eventQueue.shift();

		if (!event) {
			throw new Error('No proposed event to handle');
		}

		const isValid = validator(event.data.event, event.data.clientId);
		event.resolve(isValid);
		await new Promise<void>((r) => setTimeout(() => r(), 0));
	}

	dispatchWithTimestamp(payload: TestEvent, timestamp: number): void {
		const event: BaseEvent<TestEvent> = {
			id: createUid(),
			source: { clientId: 'host' },
			timestamp,
			context: undefined,
			payload,
		};

		super.dispatchEvent(event);
	}
}

describe('HostEventSource', () => {
	let eventSource: TestHostEventSource;

	beforeEach(() => {
		eventSource = new TestHostEventSource();
	});

	it('should add a client', () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);
	});

	it('should remove a client', () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);
		eventSource.removeClient('client1');
	});

	it('should broadcast events to clients', () => {
		const port1 = new MockPort<EventMessage<TestEvent>>();
		const port2 = new MockPort<EventMessage<TestEvent>>();

		eventSource.addClient('client1', port1);
		eventSource.addClient('client2', port2);

		eventSource.dispatch({ type: 'ADD', payload: { value: 10 } });

		expect(port1.sentMessages).toEqual([
			{
				type: 'event',
				event: {
					id: expect.any(String),
					timestamp: expect.any(Number),
					source: { clientId: 'host' },
					payload: {
						type: 'ADD',
						payload: { value: 10 },
					},
				},
			},
		]);

		expect(port2.sentMessages).toEqual([
			{
				type: 'event',
				event: {
					id: expect.any(String),
					timestamp: expect.any(Number),
					source: { clientId: 'host' },
					payload: {
						type: 'ADD',
						payload: { value: 10 },
					},
				},
			},
		]);
	});

	it('should receive proposed events from the client', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'proposeEvent',
					id: 'event1',
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			}),
		);

		expect(eventSource.eventQueue.length).toBe(1);
		expect(eventSource.eventQueue[0].data.clientId).toBe('client1');
		expect(eventSource.eventQueue[0].data.event).toEqual({
			id: 'event1',
			payload: {
				type: 'ADD',
				payload: { value: 5 },
			},
		});
	});

	it('should apply approved events from the client', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'proposeEvent',
					id: 'event1',
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			}),
		);

		await eventSource.handleNextProposedEvent(() => true);

		expect(eventSource.getState()).toEqual({ count: 5, lastOperationType: 'ADD' });
		expect(port.sentMessages).toEqual([
			{
				type: 'event',
				event: {
					id: 'event1',
					timestamp: expect.any(Number),
					source: { clientId: 'client1' },
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			},
		]);
	});

	it('should not apply rejected events from the client', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'proposeEvent',
					id: 'event1',
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			}),
		);

		await eventSource.handleNextProposedEvent(() => false);

		expect(eventSource.getState()).toEqual({ count: 0, lastOperationType: undefined });
		expect(port.sentMessages).toEqual([
			{
				type: 'rejection',
				eventId: 'event1',
			},
		]);
	});

	it('should ignore duplicate event proposals', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		eventSource.addClient('client1', port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'proposeEvent',
					id: 'event1',
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			}),
		);

		await eventSource.handleNextProposedEvent(() => true);

		// Propose the same event again
		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'proposeEvent',
					id: 'event1',
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			}),
		);

		expect(eventSource.getState()).toEqual({ count: 5, lastOperationType: 'ADD' });
		expect(eventSource.eventQueue).toHaveLength(0);
		expect(port.sentMessages).toEqual([
			{
				type: 'event',
				event: {
					id: 'event1',
					timestamp: expect.any(Number),
					source: { clientId: 'client1' },
					payload: {
						type: 'ADD',
						payload: { value: 5 },
					},
				},
			},
			{
				type: 'rejection',
				eventId: 'event1',
			},
		]);
	});

	it('should return historical events for clients', async () => {
		eventSource.dispatchWithTimestamp({ type: 'ADD', payload: { value: 10 } }, 0);
		eventSource.dispatchWithTimestamp({ type: 'SUBTRACT', payload: { value: 3 } }, 10);
		eventSource.dispatchWithTimestamp({ type: 'MULTIPLY', payload: { value: 2 } }, 20);

		const port = new MockPort<EventMessage<TestEvent>>();

		eventSource.addClient('client1', port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'requestHistory',
					since: 5,
				},
			}),
		);

		expect(port.sentMessages).toEqual([
			{
				type: 'eventHistory',
				events: [
					{
						id: expect.any(String),
						timestamp: 10,
						source: { clientId: 'host' },
						payload: {
							type: 'SUBTRACT',
							payload: { value: 3 },
						},
					},
					{
						id: expect.any(String),
						timestamp: 20,
						source: { clientId: 'host' },
						payload: {
							type: 'MULTIPLY',
							payload: { value: 2 },
						},
					},
				],
			},
		]);
	});
});
