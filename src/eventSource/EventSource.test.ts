/**
 * Comprehensive test suite for EventSource class
 *
 * This test suite covers all aspects of the EventSource implementation including:
 * - Initial state management and configuration
 * - Event dispatching and state updates
 * - Subscription pattern with error handling
 * - Event replay functionality
 * - Snapshot creation and management for performance
 * - Event insertion with proper chronological ordering
 * - Event removal with state reconstruction
 * - State rebaselining
 * - Error handling and edge cases
 * - Performance testing with large datasets
 * - Memory management and cleanup
 *
 * The tests use a simple counter state with ADD, SUBTRACT, MULTIPLY, and RESET operations
 * to validate the event sourcing behavior in a predictable manner.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Subscription } from 'rxjs';
import createUid from '../lib/createUid';
import type { BaseEvent } from './BaseEvent';
import { EventSource } from './EventSource';

// Test event types
interface TestEvent {
	type: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'RESET';
	payload?: {
		value?: number;
		newValue?: number;
	};
}

interface CounterState {
	count: number;
	lastOperationType?: string;
}

// Test implementation
class TestEventSource extends EventSource<TestEvent, CounterState> {
	constructor(initialState: CounterState = { count: 0 }, options?: { snapshotInterval?: number }) {
		super(initialState, TestEventSource.applyEvent, options);
	}

	static applyEvent(this: void, state: Readonly<CounterState>, event: TestEvent): CounterState {
		switch (event.type) {
			case 'ADD':
				return {
					count: state.count + (event.payload?.value ?? 1),
					lastOperationType: 'ADD',
				};
			case 'SUBTRACT':
				return {
					count: state.count - (event.payload?.value ?? 1),
					lastOperationType: 'SUBTRACT',
				};
			case 'MULTIPLY':
				return {
					count: state.count * (event.payload?.value ?? 1),
					lastOperationType: 'MULTIPLY',
				};
			case 'RESET':
				return {
					count: event.payload?.newValue ?? 0,
					lastOperationType: 'RESET',
				};
			default:
				return state;
		}
	}

	dispatchEventPublic(event: BaseEvent<TestEvent>): void {
		this.dispatchEvent(event);
	}

	public insertEventsPublic(events: BaseEvent<TestEvent>[]): void {
		this.insertEvents(events);
	}

	public replaceEventPublic(event: BaseEvent<TestEvent>): void {
		this.replaceEvent(event);
	}

	public removeEventPublic(event: BaseEvent<TestEvent>): void {
		this.removeEvent(event);
	}

	public createSnapshotPublic() {
		this.createSnapshot();
	}

	public rebaselinePublic(): void {
		this.rebaseline();
	}

	public getSnapshotsPublic(): Array<{ state: CounterState; eventIndex: number }> {
		return this['getSnapshots']();
	}

	public getLatestSnapshotPublic(): {
		state: CounterState;
		eventIndex: number;
	} {
		return this.getLatestSnapshot();
	}
}

describe('EventSource', () => {
	let eventSource: TestEventSource;
	let mockSubscriber: ReturnType<typeof vi.fn> & ((state: CounterState) => void);

	const createEvent = (
		type: TestEvent['type'],
		payload?: TestEvent['payload'],
		timestamp = Date.now(),
		id = createUid(),
	): BaseEvent<TestEvent> => ({
		id,
		timestamp,
		source: { clientId: 'test-client' },
		payload: {
			type,
			payload,
		},
	});

	beforeEach(() => {
		eventSource = new TestEventSource();
		mockSubscriber = vi.fn((_: CounterState) => void 0);
	});

	describe('Initial State', () => {
		it('should initialize with provided initial state', () => {
			const initialState = { count: 10, lastOperationType: 'INIT' };
			const source = new TestEventSource(initialState);

			expect(source.getState()).toEqual(initialState);
		});

		it('should initialize with default state when no initial state provided', () => {
			expect(eventSource.getState()).toEqual({ count: 0 });
		});

		it('should have no events initially', () => {
			expect(eventSource.getEvents()).toHaveLength(0);
		});

		it('should have no snapshots initially', () => {
			expect(eventSource.getSnapshotsPublic()).toHaveLength(0);
		});
	});

	describe('State Management', () => {
		it('should return immutable state', () => {
			const state1 = eventSource.getState();
			const state2 = eventSource.getState();

			expect(state1).toBe(state2); // Same reference for unchanged state
		});

		it('should apply events and update state correctly', () => {
			const addEvent = createEvent('ADD', { value: 5 });
			eventSource.dispatchEventPublic(addEvent);

			expect(eventSource.getState()).toEqual({
				count: 5,
				lastOperationType: 'ADD',
			});
		});

		it('should handle multiple events sequentially', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }));
			eventSource.dispatchEventPublic(createEvent('SUBTRACT', { value: 3 }));
			eventSource.dispatchEventPublic(createEvent('MULTIPLY', { value: 2 }));

			expect(eventSource.getState()).toEqual({
				count: 14, // ((0 + 10) - 3) * 2
				lastOperationType: 'MULTIPLY',
			});
		});
	});

	describe('Event Management', () => {
		it('should store events when dispatched', () => {
			const event1 = createEvent('ADD', { value: 1 });
			const event2 = createEvent('SUBTRACT', { value: 1 });

			eventSource.dispatchEventPublic(event1);
			eventSource.dispatchEventPublic(event2);

			const events = eventSource.getEvents();
			expect(events).toHaveLength(2);
			expect(events[0]).toBe(event1);
			expect(events[1]).toBe(event2);
		});
	});

	describe('Subscription Management', () => {
		it('should call subscriber immediately with current state', () => {
			eventSource.subscribe(mockSubscriber);

			expect(mockSubscriber).toHaveBeenCalledOnce();
			expect(mockSubscriber).toHaveBeenCalledWith({ count: 0 });
		});

		it('should notify subscribers when state changes', () => {
			eventSource.subscribe(mockSubscriber);
			mockSubscriber.mockClear();

			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));

			expect(mockSubscriber).toHaveBeenCalledOnce();
			expect(mockSubscriber).toHaveBeenCalledWith({
				count: 5,
				lastOperationType: 'ADD',
			});
		});
	});

	describe('Snapshot Management', () => {
		it('should create snapshots automatically after snapshotInterval events', () => {
			// Dispatch 100 events - should create snapshot when gap between events and last snapshot >= snapshotInterval (default 100)
			for (let i = 0; i < 100; i++) {
				eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }));
			}

			// After 100 events, snapshot should be created
			expect(eventSource.getSnapshotsPublic()).toHaveLength(1);
			expect(eventSource.getSnapshotsPublic()[0]?.state.count).toBe(100);
			expect(eventSource.getSnapshotsPublic()[0]?.eventIndex).toBe(100);
		});

		it('should use custom snapshotInterval when provided', () => {
			const customEventSource = new TestEventSource({ count: 0 }, { snapshotInterval: 5 });

			// Dispatch 5 events - should create snapshot after 5 events
			for (let i = 0; i < 5; i++) {
				customEventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }));
			}

			// After 5 events, snapshot should be created
			expect(customEventSource.getSnapshotsPublic()).toHaveLength(1);
			expect(customEventSource.getSnapshotsPublic()[0]?.state.count).toBe(5);
			expect(customEventSource.getSnapshotsPublic()[0]?.eventIndex).toBe(5);
		});
		it('should throw error for invalid snapshotInterval', () => {
			expect(() => new TestEventSource({ count: 0 }, { snapshotInterval: 0 })).toThrow(
				'snapshotInterval must be a positive integer',
			);
			expect(() => new TestEventSource({ count: 0 }, { snapshotInterval: -1 })).toThrow(
				'snapshotInterval must be a positive integer',
			);
		});

		it('should create manual snapshots', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }));

			eventSource.createSnapshotPublic();

			const snapshots = eventSource.getSnapshotsPublic();
			expect(snapshots).toHaveLength(1);
			expect(snapshots[0]?.state.count).toBe(10);
			expect(snapshots[0]?.eventIndex).toBe(1);
		});

		it('should return correct latest snapshot', () => {
			// No snapshots initially - should return initial state
			const initialSnapshot = eventSource.getLatestSnapshotPublic();
			expect(initialSnapshot.state).toEqual({ count: 0 });
			expect(initialSnapshot.eventIndex).toBe(0);

			// Create snapshots
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));
			eventSource.createSnapshotPublic();

			eventSource.dispatchEventPublic(createEvent('ADD', { value: 3 }));
			eventSource.createSnapshotPublic();

			const latestSnapshot = eventSource.getLatestSnapshotPublic();
			expect(latestSnapshot.state.count).toBe(8);
			expect(latestSnapshot.eventIndex).toBe(2);
		});
	});

	describe('Event Insertion and Ordering', () => {
		it('should insert events in chronological order', () => {
			const baseTime = Date.now();

			// Insert events out of order
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, baseTime + 200));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, baseTime + 400));

			// Insert earlier events
			const earlierEvents = [
				createEvent('ADD', { value: 10 }, baseTime + 100),
				createEvent('ADD', { value: 10 }, baseTime + 300),
			];

			eventSource.insertEventsPublic(earlierEvents);

			// Final state should be 22 (10 + 1 + 10 + 1)
			expect(eventSource.getState().count).toBe(22);

			// Events should be in chronological order
			const events = eventSource.getEvents();
			expect(events.map((e) => e.timestamp)).toEqual([
				baseTime + 100,
				baseTime + 200,
				baseTime + 300,
				baseTime + 400,
			]);
		});

		it('should handle events with same timestamp using ID for ordering', () => {
			const timestamp = Date.now();

			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, timestamp, 'b'));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, timestamp, 'd'));

			const newEvents = [
				createEvent('ADD', { value: 10 }, timestamp, 'a'),
				createEvent('ADD', { value: 10 }, timestamp, 'c'),
			];

			eventSource.insertEventsPublic(newEvents);

			const events = eventSource.getEvents();
			expect(events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd']);
		});

		it('should handle empty event insertion', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));
			const stateBefore = eventSource.getState();

			eventSource.insertEventsPublic([]);

			expect(eventSource.getState()).toEqual(stateBefore);
		});
	});

	describe('Event Replacement', () => {
		it('should replace existing event and update state accordingly', () => {
			const event1 = createEvent('ADD', { value: 5 }, Date.now(), 'event1');
			const event2 = createEvent('ADD', { value: 3 }, Date.now(), 'event2');

			eventSource.dispatchEventPublic(event1);
			eventSource.dispatchEventPublic(event2);

			expect(eventSource.getState().count).toBe(8);

			// Replace event1 with a different value
			const replacedEvent1: BaseEvent<TestEvent> = {
				...event1,
				payload: { type: 'ADD', payload: { value: 10 } },
			};
			eventSource.replaceEventPublic(replacedEvent1);

			expect(eventSource.getState().count).toBe(13); // (0 + 10) + 3
			expect(eventSource.getEvents()).toHaveLength(2);
			expect(eventSource.getEvents()[0]).toBe(replacedEvent1);
		});

		it('should handle replacement of non-existent event gracefully', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));
			const stateBefore = eventSource.getState();
			const eventsBefore = eventSource.getEvents();

			const nonExistentEvent = createEvent('ADD', { value: 10 }, Date.now(), 'non-existent');
			eventSource.replaceEventPublic(nonExistentEvent);

			expect(eventSource.getState()).toEqual(stateBefore);
			expect(eventSource.getEvents()).toEqual(eventsBefore);
		});
	});

	describe('Event Removal', () => {
		it('should remove events and replay from snapshot', () => {
			// Create some events
			const event1 = createEvent('ADD', { value: 5 }, Date.now() + 100, 'event1');
			const event2 = createEvent('ADD', { value: 3 }, Date.now() + 200, 'event2');
			const event3 = createEvent('ADD', { value: 2 }, Date.now() + 300, 'event3');

			eventSource.dispatchEventPublic(event1);
			eventSource.createSnapshotPublic(); // Snapshot after event1
			eventSource.dispatchEventPublic(event2);
			eventSource.dispatchEventPublic(event3);

			expect(eventSource.getState().count).toBe(10);

			// Remove event2
			eventSource.removeEventPublic(event2);

			expect(eventSource.getState().count).toBe(7); // 5 + 2 (event1 + event3)
			expect(eventSource.getEvents()).toHaveLength(2);
			expect(eventSource.getEvents().find((e) => e.id === 'event2')).toBeUndefined();
		});

		it('should handle removal of non-existent event', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));
			const stateBefore = eventSource.getState();
			const eventsBefore = eventSource.getEvents();

			const nonExistentEvent = createEvent('ADD', { value: 1 }, Date.now(), 'non-existent');
			eventSource.removeEventPublic(nonExistentEvent);

			expect(eventSource.getState()).toEqual(stateBefore);
			expect(eventSource.getEvents()).toEqual(eventsBefore);
		});
	});

	describe('Rebaseline', () => {
		it('should reset to new baseline state', () => {
			// Add some events
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }));
			eventSource.dispatchEventPublic(createEvent('MULTIPLY', { value: 2 }));
			eventSource.createSnapshotPublic();

			expect(eventSource.getState().count).toBe(20);
			expect(eventSource.getEvents()).toHaveLength(2);
			expect(eventSource.getSnapshotsPublic()).toHaveLength(1);

			// Rebaseline
			const newBaseState = eventSource.getState();
			eventSource.subscribe(mockSubscriber);
			mockSubscriber.mockClear();

			eventSource.rebaselinePublic();

			expect(eventSource.getState()).toEqual(newBaseState);
			expect(eventSource.getEvents()).toHaveLength(0);
			expect(eventSource.getSnapshotsPublic()).toHaveLength(0);
			expect(mockSubscriber).toHaveBeenCalledWith(newBaseState);
		});
	});

	describe('Error Handling', () => {
		it('should handle errors in applyEvent function gracefully', () => {
			// Create an event source with a faulty applyEvent function
			class FaultyEventSource extends EventSource<TestEvent, CounterState> {
				constructor() {
					super({ count: 0 }, FaultyEventSource.faultyApplyEvent);
				}

				static faultyApplyEvent(
					this: void,
					state: Readonly<CounterState>,
					event: TestEvent,
				): CounterState {
					if (event.type === 'SUBTRACT') {
						throw new Error('Faulty apply event');
					}
					return TestEventSource.applyEvent(state, event);
				}

				dispatchEventPublic(event: BaseEvent<TestEvent>): void {
					this.dispatchEvent(event);
				}
			}

			const faultySource = new FaultyEventSource();

			// Should work fine for ADD
			expect(() =>
				faultySource.dispatchEventPublic(createEvent('ADD', { value: 1 })),
			).not.toThrow();

			// Should throw for SUBTRACT
			expect(() => faultySource.dispatchEventPublic(createEvent('SUBTRACT', { value: 1 }))).toThrow(
				'Faulty apply event',
			);
		});
	});

	describe('Performance and Memory', () => {
		it('should handle large number of events efficiently', () => {
			const startTime = Date.now();

			// Add 1000 events
			for (let i = 0; i < 1000; i++) {
				eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }));
			}

			const endTime = Date.now();

			expect(eventSource.getState().count).toBe(1000);
			expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
		});

		it('should create multiple snapshots for many events', () => {
			// Add more than 200 events to trigger multiple snapshots
			for (let i = 0; i < 250; i++) {
				eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }));
			}

			const snapshots = eventSource.getSnapshotsPublic();
			expect(snapshots.length).toBeGreaterThan(1);
		});
	});

	describe('Edge Cases', () => {
		it('should handle events with undefined payload', () => {
			const event = createEvent('ADD'); // No payload
			eventSource.dispatchEventPublic(event);

			expect(eventSource.getState().count).toBe(1); // Default value
		});

		it('should handle concurrent subscription/unsubscription during notification', () => {
			let subscription: Subscription;

			const subscriber = vi.fn().mockImplementation(() => {
				// Unsubscribe during notification
				if (subscription) {
					subscription.unsubscribe();
				}
			});

			subscription = eventSource.subscribe(subscriber);
			subscriber.mockClear();

			// This should not throw even though subscriber unsubscribes during notification
			expect(() => eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }))).not.toThrow();
		});

		it('should handle inserting events at the beginning of timeline', () => {
			const laterTime = Date.now() + 1000;

			// Add some events with later timestamps
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }, laterTime));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 3 }, laterTime + 100));

			expect(eventSource.getState().count).toBe(8);

			// Insert events at the beginning
			const earlierEvents = [
				createEvent('ADD', { value: 10 }, Date.now()),
				createEvent('MULTIPLY', { value: 2 }, Date.now() + 100),
			];

			eventSource.insertEventsPublic(earlierEvents);

			// Should be: (0 + 10) * 2 + 5 + 3 = 28
			expect(eventSource.getState().count).toBe(28);
		});

		it('should handle inserting events in the middle of timeline', () => {
			const baseTime = Date.now();

			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }, baseTime));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }, baseTime + 300));

			expect(eventSource.getState().count).toBe(20);

			// Insert event in the middle
			const middleEvents = [createEvent('MULTIPLY', { value: 2 }, baseTime + 150)];

			eventSource.insertEventsPublic(middleEvents);

			// Should be: (0 + 10) * 2 + 10 = 30
			expect(eventSource.getState().count).toBe(30);
		});

		it('should handle snapshot cleanup during event removal', () => {
			// Create multiple snapshots
			for (let i = 0; i < 250; i++) {
				eventSource.dispatchEventPublic(
					createEvent('ADD', { value: 1 }, Date.now() + i, `event${i}`),
				);
			}

			const snapshotsBefore = eventSource.getSnapshotsPublic().length;
			expect(snapshotsBefore).toBeGreaterThan(1);

			// Remove an early event - should drop some snapshots
			const eventToRemove = createEvent('ADD', { value: 1 }, Date.now() + 50, 'event50');
			eventSource.removeEventPublic(eventToRemove);

			// Some snapshots should have been dropped
			const snapshotsAfter = eventSource.getSnapshotsPublic().length;
			expect(snapshotsAfter).toBeLessThan(snapshotsBefore);
		});

		it('should handle event removal when no snapshots exist', () => {
			const event1 = createEvent('ADD', { value: 5 }, Date.now(), 'event1');
			const event2 = createEvent('ADD', { value: 3 }, Date.now() + 100, 'event2');

			eventSource.dispatchEventPublic(event1);
			eventSource.dispatchEventPublic(event2);

			expect(eventSource.getSnapshotsPublic()).toHaveLength(0);
			expect(eventSource.getState().count).toBe(8);

			// Remove first event - should work even without snapshots
			eventSource.removeEventPublic(event1);

			expect(eventSource.getState().count).toBe(3);
			expect(eventSource.getEvents()).toHaveLength(1);
		});

		it('should maintain event order after complex operations', () => {
			const baseTime = Date.now();

			// Add initial events
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, baseTime + 200, 'b'));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, baseTime + 400, 'd'));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 1 }, baseTime + 600, 'f'));

			// Insert interleaved events
			eventSource.insertEventsPublic([
				createEvent('ADD', { value: 1 }, baseTime + 100, 'a'),
				createEvent('ADD', { value: 1 }, baseTime + 300, 'c'),
				createEvent('ADD', { value: 1 }, baseTime + 500, 'e'),
			]);

			// Remove one event
			eventSource.removeEventPublic(createEvent('ADD', { value: 1 }, baseTime + 300, 'c'));

			const events = eventSource.getEvents();
			expect(events.map((e) => e.id)).toEqual(['a', 'b', 'd', 'e', 'f']);
			expect(events.map((e) => e.timestamp)).toEqual([
				baseTime + 100,
				baseTime + 200,
				baseTime + 400,
				baseTime + 500,
				baseTime + 600,
			]);
		});

		it('should handle zero-value operations', () => {
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 5 }));
			eventSource.dispatchEventPublic(createEvent('MULTIPLY', { value: 0 }));
			eventSource.dispatchEventPublic(createEvent('ADD', { value: 10 }));

			expect(eventSource.getState().count).toBe(10); // (5 * 0) + 10
		});

		it('should handle insertion at the exact beginning with snapshots', () => {
			// Create events and snapshots
			for (let i = 0; i < 150; i++) {
				eventSource.dispatchEventPublic(
					createEvent('ADD', { value: 1 }, Date.now() + 1000 + i, `later${i}`),
				);
			}

			expect(eventSource.getSnapshotsPublic().length).toBeGreaterThan(0);

			// Insert events at the very beginning (before all existing events)
			const veryEarlyEvents = [
				createEvent('ADD', { value: 100 }, Date.now(), 'early1'),
				createEvent('MULTIPLY', { value: 2 }, Date.now() + 10, 'early2'),
			];

			eventSource.insertEventsPublic(veryEarlyEvents);

			// Should trigger dropSnapshotsAfterEventIndex with index 0
			expect(eventSource.getState().count).toBe(350); // (0 + 100) * 2 + 150 events of +1 each = 350
		});
	});
});
