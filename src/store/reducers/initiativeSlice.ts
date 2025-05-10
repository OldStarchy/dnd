import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { Entity } from '../types/Entity';

export interface InitiativeState {
	entities: Entity[];
}

const initialState: InitiativeState = {
	entities: [],
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
	},
});

// Action creators are generated for each case reducer function
export const { setEntity, removeEntity, setDefault } = initiativeSlice.actions;

export default initiativeSlice.reducer;
