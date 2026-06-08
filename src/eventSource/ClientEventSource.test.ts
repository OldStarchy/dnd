import { describe, expect, it } from 'vitest';
import { applyEvent } from './__test/applyEvent';
import type { CounterState } from './__test/CounterState';
import { MockPort } from './__test/MockPort';
import type { TestEvent } from './__test/TestEvent';
import type { BaseEvent } from './BaseEvent';
import ClientEventSource from './ClientEventSource';
import type { EventMessage } from './EventMessage';
import type { ReconnectingPort } from './ReconnectingPort';
class TestHostEventSource extends ClientEventSource<TestEvent, CounterState> {
	eventQueue: {
		data: { event: Omit<BaseEvent<TestEvent>, 'timestamp' | 'source'>; clientId: string };
		resolve: (ok: boolean) => void;
	}[] = [];

	constructor(port: ReconnectingPort<EventMessage<TestEvent>>) {
		super({ count: 0 }, applyEvent, port);
	}
}

describe('ClientEventSource', () => {
	it('should construct', () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		expect(eventSource.getState()).toEqual({ count: 0 });
	});

	it('should request event history on connect', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const _ = new TestHostEventSource(port);

		await port.simulateReceivedEvent('connected', new Event('connected'));

		expect(port.sentMessages).toHaveLength(1);
		expect(port.sentMessages[0]).toMatchObject({
			type: 'requestHistory',
			since: 0,
		});
	});

	it('should request event history since the latest event timestamp on connect', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const _ = new TestHostEventSource(port);

		// Simulate receiving an event from the host
		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'event',
					event: {
						id: 'event1',
						payload: { type: 'ADD', payload: { value: 5 } },
						source: { clientId: 'host' },
						timestamp: 100,
					},
				},
			}),
		);

		await port.simulateReceivedEvent('connected', new Event('connected'));

		expect(port.sentMessages).toEqual([
			{
				type: 'requestHistory',
				since: 100,
			},
		]);
	});

	it('should apply received event history', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'eventHistory',
					events: [
						{
							id: 'event1',
							payload: { type: 'ADD', payload: { value: 5 } },
							source: { clientId: 'host' },
							timestamp: 100,
						},
						{
							id: 'event2',
							payload: { type: 'SUBTRACT', payload: { value: 2 } },
							source: { clientId: 'host' },
							timestamp: 200,
						},
					],
				},
			}),
		);

		expect(eventSource.getState()).toEqual({ count: 3, lastOperationType: 'SUBTRACT' });
	});

	it('should send a proposed event to the host', () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		eventSource.propose({ type: 'ADD', payload: { value: 5 } });

		expect(port.sentMessages).toHaveLength(1);
		expect(port.sentMessages[0]).toMatchObject({
			type: 'proposeEvent',
			id: expect.any(String),
			payload: { type: 'ADD', payload: { value: 5 } },
		});
	});

	it('should proactively apply proposed events', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		eventSource.propose({ type: 'ADD', payload: { value: 5 } });

		expect(eventSource.getState()).toEqual({ count: 5, lastOperationType: 'ADD' });
	});

	it('should redact rejected proposed events', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		eventSource.propose({ type: 'ADD', payload: { value: 5 } });

		const proposedEventId = // oxlint-disable-next-line typescript/consistent-type-assertions
			(port.sentMessages[0] as EventMessage<TestEvent> & { type: 'proposeEvent' }).id;

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'rejection',
					eventId: proposedEventId,
				},
			}),
		);

		expect(eventSource.getState()).toEqual({ count: 0 });
	});

	it('should keep approved proposed events', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		eventSource.propose({ type: 'ADD', payload: { value: 5 } });

		// oxlint-disable-next-line typescript/consistent-type-assertions
		const msg = port.sentMessages[0] as EventMessage<TestEvent> & { type: 'proposeEvent' };

		await port.simulateReceivedEvent(
			'message',
			new MessageEvent('message', {
				data: {
					type: 'event',
					event: {
						id: msg.id,
						payload: msg.payload,
						source: { clientId: 'self' },
						timestamp: Date.now(),
					},
				},
			}),
		);

		expect(eventSource.getState()).toEqual({ count: 5, lastOperationType: 'ADD' });
	});

	it('should resend pending proposed events on reconnect', async () => {
		const port = new MockPort<EventMessage<TestEvent>>();
		const eventSource = new TestHostEventSource(port);

		eventSource.propose({ type: 'ADD', payload: { value: 5 } });

		const proposedEventId = // oxlint-disable-next-line typescript/consistent-type-assertions
			(port.sentMessages[0] as EventMessage<TestEvent> & { type: 'proposeEvent' }).id;

		// Simulate disconnection and reconnection
		await port.simulateReceivedEvent('connected', new Event('connected'));

		// The proposed event should be resent
		expect(port.sentMessages).toHaveLength(3);
		expect(port.sentMessages[1]).toMatchObject({
			type: 'proposeEvent',
			id: proposedEventId,
			payload: { type: 'ADD', payload: { value: 5 } },
		});
	});
});
