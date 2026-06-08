import type { CounterState } from './CounterState';
import type { TestEvent } from './TestEvent';

export function applyEvent(state: Readonly<CounterState>, event: TestEvent): CounterState {
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
