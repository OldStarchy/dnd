import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import initiativeReducer from './reducers/initiativeSlice';

const listenerMiddlewareInstance = createListenerMiddleware();

export const primaryStore = configureStore({
	reducer: {
		initiative: initiativeReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().prepend(listenerMiddlewareInstance.middleware),
});

export type PrimaryState = ReturnType<typeof primaryStore.getState>;
export type PrimaryDispatch = typeof primaryStore.dispatch;

export const usePrimaryDispatch = useDispatch.withTypes<PrimaryDispatch>();
export const usePrimarySelector = useSelector.withTypes<PrimaryState>();
