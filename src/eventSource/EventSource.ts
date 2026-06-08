import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	Observable,
	type Observer,
	type Subscribable,
	type Subscription,
} from 'rxjs';
import type { BaseEvent } from './BaseEvent';
import { mergeSorted } from './mergeSorted';

export class EventSource<EventPayload, State> implements Subscribable<Readonly<State>> {
	constructor(
		private initialState: Readonly<State>,
		protected readonly applyEvent: (state: Readonly<State>, event: EventPayload) => State,
		{ snapshotInterval = 100 } = {},
	) {
		if (snapshotInterval <= 0) {
			throw new Error('snapshotInterval must be a positive integer');
		}

		this.#state$ = new BehaviorSubject<{ state: State; events: BaseEvent<EventPayload>[] }>({
			state: initialState,
			events: [],
		});

		this.#snapshotInterval = snapshotInterval;
	}

	asObservable(): Observable<Readonly<State>> {
		return this.#state$.asObservable().pipe(map((s) => s.state));
	}

	subscribe(
		observerOrNext: Partial<Observer<Readonly<State>>> | ((state: Readonly<State>) => void),
	): Subscription {
		return this.#state$.pipe(map((s) => s.state)).subscribe(observerOrNext);
	}

	getState(): Readonly<State> {
		return this.#state$.getValue().state;
	}

	getEvents(): readonly Readonly<BaseEvent<EventPayload>>[] {
		return this.#state$.getValue().events;
	}

	events$(): Observable<readonly Readonly<BaseEvent<EventPayload>>[]> {
		return this.#state$.pipe(map((s) => s.events));
	}

	select$<const Selected>(selector: (state: Readonly<State>) => Selected): Observable<Selected> {
		return this.#state$.pipe(
			map(({ state }) => selector(state)),
			distinctUntilChanged(),
		);
	}

	protected dispatchEvent(event: BaseEvent<EventPayload>): void {
		const state = this.applyEvent(this.getState(), event.payload);
		const events = [...this.getEvents(), event];

		this.#state$.next({ state, events });

		const latestSnapshot = this.getLatestSnapshot();

		if (events.length - latestSnapshot.eventIndex >= this.#snapshotInterval) {
			this.createSnapshot();
		}
	}

	protected replaceEvent(event: BaseEvent<EventPayload>): void {
		const index = this.getEvents().findIndex((e) => e.id === event.id);
		if (index === -1) return;

		this.dropSnapshotsAfterEventIndex(index);

		this.replaceEventsAfterLatestSnapshot((oldEvents) =>
			oldEvents.map((e) => (e.id === event.id ? event : e)),
		);
	}

	protected replay(initial: State, events: BaseEvent<EventPayload>[]): State {
		return events.reduce((state, event) => this.applyEvent(state, event.payload), initial);
	}

	protected createSnapshot(): void {
		const snapshot = {
			state: this.getState(),
			eventIndex: this.getEvents().length,
		};
		this.#snapshots.push(snapshot);
	}

	protected removeEvent(event: BaseEvent<EventPayload>): void {
		const index = this.getEvents().findIndex((e) => e.id === event.id);
		if (index === -1) return;

		this.dropSnapshotsAfterEventIndex(index);

		this.replaceEventsAfterLatestSnapshot((oldEvents) =>
			oldEvents.filter((e) => e.id !== event.id),
		);
	}

	protected getLatestSnapshot(): { state: State; eventIndex: number } {
		if (this.#snapshots.length === 0) {
			return { state: this.initialState, eventIndex: 0 };
		}
		return this.#snapshots[this.#snapshots.length - 1];
	}

	protected dropLatestSnapshot(): void {
		this.#snapshots.pop();
	}

	protected insertEvents(events: BaseEvent<EventPayload>[]): void {
		const firstEvent = events[0];
		if (firstEvent === undefined) return;

		const firstNewEventTimestamp = firstEvent.timestamp;
		const postEventIndex = this.getEvents().findIndex((e) => e.timestamp > firstNewEventTimestamp);
		const insertIndex = postEventIndex === -1 ? this.getEvents().length : postEventIndex;

		this.dropSnapshotsAfterEventIndex(insertIndex);

		this.replaceEventsAfterLatestSnapshot((oldEvents) =>
			mergeSorted(oldEvents, events, (a, b) =>
				a.timestamp !== b.timestamp ? a.timestamp - b.timestamp : a.id.localeCompare(b.id),
			),
		);
	}

	protected rebaseline(): void {
		const state = this.getState();

		this.initialState = state;
		this.#snapshots = [];
		this.#state$.next({
			state,
			events: [],
		});
	}

	private dropSnapshotsAfterEventIndex(eventIndex: number): void {
		while (this.getLatestSnapshot().eventIndex > eventIndex) {
			this.dropLatestSnapshot();
		}
	}

	private splitAtLatestSnapshot() {
		const snapshot = this.getLatestSnapshot();
		const priorEvents = this.getEvents().slice(0, snapshot.eventIndex);
		const postEvents = this.getEvents().slice(snapshot.eventIndex);

		return { state: snapshot.state, priorEvents, postEvents };
	}

	private replaceEventsAfterLatestSnapshot(
		modifier: (oldEvents: BaseEvent<EventPayload>[]) => BaseEvent<EventPayload>[],
	): void {
		const { state, priorEvents, postEvents } = this.splitAtLatestSnapshot();
		const modifiedEvents = modifier(postEvents);

		if (modifiedEvents === postEvents) return;

		this.#state$.next({
			state: this.replay(state, modifiedEvents),
			events: [...priorEvents, ...modifiedEvents],
		});
	}

	//for testing
	private getSnapshots(): Array<{ state: State; eventIndex: number }> {
		return this.#snapshots;
	}

	readonly #state$: BehaviorSubject<{
		state: State;
		events: BaseEvent<EventPayload>[];
	}>;

	// Snapshot of state just before eventIndex
	#snapshots: { state: State; eventIndex: number }[] = [];

	readonly #snapshotInterval: number;
}
