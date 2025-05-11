import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Entity } from '../types/Entity';

export interface InitiativeState {
	entities: Entity[];
	currentTurnEntityId: string | null;
}

const initialState: InitiativeState = {
	entities: [],
	currentTurnEntityId: null,
};

export const initiativeSlice = createSlice({
	name: 'initiative',
	initialState,
	reducers: {
		setEntity: (state, action: PayloadAction<Entity>) => {
			const existing = state.entities.find(
				(e) => e.id === action.payload.id,
			);
			if (existing) {
				Object.assign(existing, action.payload);
			} else {
				state.entities.push(action.payload);
			}
		},
		removeEntity: (state, action: PayloadAction<string>) => {
			state.entities = state.entities.filter(
				(e) => e.id !== action.payload,
			);
		},
		setDefault: (state, action: PayloadAction<Entity[]>) => {
			if (state.entities.length === 0) {
				state.entities = action.payload;
			}
		},
		setCurrentTurnEntityId: (
			state,
			action: PayloadAction<string | null>,
		) => {
			if (action.payload === null) {
				state.currentTurnEntityId = null;
				return;
			}

			const entity = state.entities.find((e) => e.id === action.payload);
			if (entity) {
				state.currentTurnEntityId = action.payload;
			} else {
				state.currentTurnEntityId = null;
			}
		},
		swapEntities: (
			state,
			action: PayloadAction<[a: number, b: number]>,
		) => {
			const [a, b] = action.payload;
			if (
				a < 0 ||
				a >= state.entities.length ||
				b < 0 ||
				b >= state.entities.length ||
				a === b
			) {
				return;
			}

			const temp = state.entities[a];
			state.entities[a] = state.entities[b];
			state.entities[b] = temp;
		},
	},
});

// Action creators are generated for each case reducer function
export const {
	setEntity,
	removeEntity,
	setDefault,
	setCurrentTurnEntityId,
	swapEntities,
} = initiativeSlice.actions;

export default initiativeSlice.reducer;
