import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import initiativeReducer from './reducers/initiativeSlice';

const listenerMiddlewareInstance = createListenerMiddleware();

const persistConfig = {
	key: 'dnd.primary-store',
	storage,
};

export const primaryStore = configureStore({
	reducer: {
		initiative: persistReducer(persistConfig, initiativeReducer),
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().prepend(listenerMiddlewareInstance.middleware),
});

export const persistor = persistStore(primaryStore);

export type PrimaryState = ReturnType<typeof primaryStore.getState>;
export type PrimaryDispatch = typeof primaryStore.dispatch;

export const usePrimaryDispatch = useDispatch.withTypes<PrimaryDispatch>();
export const usePrimarySelector = useSelector.withTypes<PrimaryState>();
