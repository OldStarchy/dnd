import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { createDeferredForwardingMiddleware } from './middleware/createDeferredForwardingMiddleware';
import initiativeReducer from './reducers/initiativeSlice';

const { middleware: syncMiddleware, setPort } =
	createDeferredForwardingMiddleware((action) => true);

export const store = configureStore({
	reducer: {
		initiative: initiativeReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(syncMiddleware),
});

export { setPort };

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
