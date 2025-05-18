import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import reducedInitiativeReducer from './reducers/reduced-initiative-slice';

export const reducedStore = configureStore({
	reducer: {
		reducedInitiative: reducedInitiativeReducer,
	},
});

export type ReducedState = ReturnType<typeof reducedStore.getState>;
export type ReducedDispatch = typeof reducedStore.dispatch;

export const useReducedDispatch = useDispatch.withTypes<ReducedDispatch>();
export const useReducedSelector = useSelector.withTypes<ReducedState>();
