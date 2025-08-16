import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import z from 'zod';
import initiativeReducer, {
	type InitiativeState,
} from './reducers/initiativeSlice';
import { entitySchema } from './types/Entity';

const listenerMiddlewareInstance = createListenerMiddleware();

const stateSchema = z.object({
	entities: entitySchema.array(),
	currentTurnEntityId: z.string().nullable(),
});

const stored = localStorage.getItem('initiative');

const initialInitiative: InitiativeState = (() => {
	try {
		const parsed = JSON.parse(stored ?? '');
		return (
			stateSchema.safeParse(parsed).data ?? {
				entities: [],
				currentTurnEntityId: null,
			}
		);
	} catch {
		return {
			entities: [],
			currentTurnEntityId: null,
		};
	}
})();

export const primaryStore = configureStore({
	reducer: {
		initiative: initiativeReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().prepend(listenerMiddlewareInstance.middleware),
	preloadedState: {
		initiative: initialInitiative,
	},
});

primaryStore.subscribe(() => {
	const state = primaryStore.getState();
	const parsed = stateSchema.safeParse(state.initiative);
	if (parsed.success) {
		localStorage.setItem('initiative', JSON.stringify(parsed.data));
	} else {
		console.error('Failed to save initiative state:', parsed.error);
	}
});

export type PrimaryState = ReturnType<typeof primaryStore.getState>;
export type PrimaryDispatch = typeof primaryStore.dispatch;

export const usePrimaryDispatch = useDispatch.withTypes<PrimaryDispatch>();
export const usePrimarySelector = useSelector.withTypes<PrimaryState>();
